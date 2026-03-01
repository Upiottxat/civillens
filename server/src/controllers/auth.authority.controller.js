const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { prisma } = require('../lib/prisma');
const { success, error } = require('../utils/response');

/**
 * POST /api/v1/auth/authority/login
 * Email + password login for authority / admin users.
 */
async function authorityLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, 'Email and password are required.');
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      return error(res, 'Invalid email or password.', 401);
    }

    if (user.role !== 'AUTHORITY' && user.role !== 'ADMIN') {
      return error(res, 'This portal is for authorized officials only.', 403);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return error(res, 'Invalid email or password.', 401);
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return success(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        department: user.department,
        designation: user.designation,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/authority/register
 * Register a new authority / admin officer.
 */
async function authorityRegister(req, res, next) {
  try {
    const { name, email, password, phone, department, designation, role } = req.body;

    if (!name || !email || !password) {
      return error(res, 'Name, email, and password are required.');
    }

    if (password.length < 8) {
      return error(res, 'Password must be at least 8 characters.');
    }

    // Only AUTHORITY can self-register; ADMIN requires manual DB setup
    const userRole = 'AUTHORITY';

    // Check existing email
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return error(res, 'An account with this email already exists.');
    }

    // Generate a unique phone placeholder if not provided
    const userPhone = phone || `AUTH-${Date.now()}`;
    const existingPhone = await prisma.user.findUnique({ where: { phone: userPhone } });
    if (existingPhone) {
      return error(res, 'An account with this phone number already exists.');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: userPhone,
        passwordHash,
        role: userRole,
        department: department || null,
        designation: designation || null,
      },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return success(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        department: user.department,
        designation: user.designation,
      },
    }, 201);
  } catch (err) {
    next(err);
  }
}

module.exports = { authorityLogin, authorityRegister };
