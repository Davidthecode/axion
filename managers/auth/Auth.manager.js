const bcrypt = require('bcryptjs');

module.exports = class AuthManager {
  constructor({ config, managers, mongomodels, validators }) {
    this.config = config;
    this.validators = validators;
    this.mongomodels = mongomodels;
    this.tokenManager = managers.token;
    this.httpExposed = ['post=login', 'post=signupSuperAdmin', 'post=createSchoolAdmin', 'get=getMyProfile'];
  }

  async login({ email, password }) {
    if (!email || !password) return { ok: false, code: 400, errors: 'email and password are required' };

    const sanitizedEmail = email.trim().toLowerCase();

    const user = await this.mongomodels.user.findOne({ email: sanitizedEmail });
    if (!user) return { ok: false, code: 401, errors: 'invalid credentials' };

    const match = await bcrypt.compare(password, user.password);
    if (!match) return { ok: false, code: 401, errors: 'invalid credentials' };

    const token = this.tokenManager.genShortToken({
      userId: user._id,
      role: user.role,
      schoolId: user.schoolId
    });

    return {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId
      },
      token
    };
  }

  async signupSuperAdmin({ username, email, password, adminKey }) {
    if (!adminKey || adminKey !== this.config.dotEnv.SUPERADMIN_CREATION_KEY) {
      return { ok: false, code: 401, errors: 'unauthorized: invalid admin key' };
    }

    if (!password || password.length < 8) {
      return { ok: false, code: 400, errors: 'password must be at least 8 characters long' };
    }

    const sanitizedEmail = email.trim().toLowerCase();

    const existingUser = await this.mongomodels.user.findOne({ $or: [{ email: sanitizedEmail }, { username }] });
    if (existingUser) return { ok: false, code: 409, errors: 'user already exists' };

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.mongomodels.user.create({
      username,
      email: sanitizedEmail,
      password: hashedPassword,
      role: 'superadmin'
    });

    const token = this.tokenManager.genShortToken({
      userId: user._id,
      role: user.role
    });

    return {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    };
  }

  async createSchoolAdmin({ __superadmin, username, email, password, schoolId }) {
    if (!__superadmin) return { ok: false, code: 401, errors: 'unauthorized' };

    if (!password || password.length < 8) {
      return { ok: false, code: 400, errors: 'password must be at least 8 characters long' };
    }

    const sanitizedEmail = email.trim().toLowerCase();

    const existingUser = await this.mongomodels.user.findOne({ $or: [{ email: sanitizedEmail }, { username }] });
    if (existingUser) return { ok: false, code: 409, errors: 'user already exists' };

    const school = await this.mongomodels.school.findById(schoolId);
    if (!school) return { ok: false, code: 404, errors: 'school not found' };

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.mongomodels.user.create({
      username,
      email: sanitizedEmail,
      password: hashedPassword,
      role: 'schooladmin',
      schoolId
    });

    return {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId
      }
    };
  }

  async getMyProfile({ __superadmin, __schooladmin }) {
    const sessionUser = __superadmin || __schooladmin;
    if (!sessionUser) return { ok: false, code: 401, errors: 'unauthorized' };

    const user = await this.mongomodels.user.findById(sessionUser.userId).select('-password');
    if (!user) return { ok: false, code: 404, errors: 'user not found' };

    return { user };
  }
}
