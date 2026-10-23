const User = require('../models/User');
const { generateToken, setAuthCookie, clearAuthCookie } = require('../utils/jwt');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate mandatory fields and prevent parameter tampering
    if (
      !name || typeof name !== 'string' ||
      !email || typeof email !== 'string' ||
      !password || typeof password !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Name, email, and password are required.'
        }
      });
    }

    // 2. Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Please provide a valid email address.'
        }
      });
    }

    // 3. Enforce minimum password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 8 characters long.'
        }
      });
    }

    // 4. Reject duplicate accounts
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'An account with this email address already exists.'
        }
      });
    }

    // 5. Create user (password is automatically hashed via pre-save hook)
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password
    });

    // 6. Generate JWT and set HttpOnly cookie
    const token = generateToken({
      id: newUser._id.toString(),
      email: newUser.email
    });
    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      data: {
        user: newUser.toJSON()
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Log in an existing user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input presence and prevent parameter tampering
    if (
      !email || typeof email !== 'string' ||
      !password || typeof password !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CREDENTIALS',
          message: 'Email and password are required.'
        }
      });
    }

    // 2. Find user by normalized email (include password for comparison)
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.'
        }
      });
    }

    // 3. Compare password with bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.'
        }
      });
    }

    // 4. Generate JWT and set HttpOnly cookie
    const token = generateToken({
      id: user._id.toString(),
      email: user.email
    });
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Authenticated user profile not found.'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Log out user by clearing cookie
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    clearAuthCookie(res);
    return res.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully.'
      }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout
};
