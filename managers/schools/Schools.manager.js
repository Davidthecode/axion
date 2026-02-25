module.exports = class SchoolsManager {
  constructor({ config, managers, mongomodels, validators }) {
    this.config = config;
    this.mongomodels = mongomodels;
    this.validators = validators;
    this.httpExposed = [
      'post=createSchool',
      'get=getSchools',
      'get=getSchool',
      'patch=updateSchool',
      'delete=deleteSchool'
    ];
  }

  async createSchool({ __superadmin, name, address, phone, email }) {
    if (!__superadmin) return { ok: false, code: 401, errors: 'unauthorized' };

    const validate = await this.validators.schools.createSchool({ name, address, phone, email });
    if (validate) return { ok: false, code: 400, errors: validate };

    const school = await this.mongomodels.school.create({
      name,
      address,
      phone,
      email
    });

    return { school };
  }

  async getSchools({ __superadmin }) {
    if (!__superadmin) return { ok: false, code: 401, errors: 'unauthorized' };

    const schools = await this.mongomodels.school.find();
    return { schools };
  }

  async getSchool({ __superadmin, schoolId }) {
    if (!__superadmin) return { ok: false, code: 401, errors: 'unauthorized' };

    const school = await this.mongomodels.school.findById(schoolId);
    if (!school) return { ok: false, code: 404, errors: 'school not found' };

    return { school };
  }

  async updateSchool({ __superadmin, schoolId, name, address, phone, email }) {
    if (!__superadmin) return { ok: false, code: 401, errors: 'unauthorized' };

    const validate = await this.validators.schools.updateSchool({ name, address, phone, email });
    if (validate) return { ok: false, code: 400, errors: validate };

    const school = await this.mongomodels.school.findByIdAndUpdate(
      schoolId,
      { name, address, phone, email },
      { new: true }
    );

    if (!school) return { ok: false, code: 404, errors: 'school not found' };
    return { school };
  }

  async deleteSchool({ __superadmin, schoolId }) {
    if (!__superadmin) return { ok: false, code: 401, errors: 'unauthorized' };

    const school = await this.mongomodels.school.findByIdAndDelete(schoolId);
    if (!school) return { ok: false, code: 404, errors: 'school not found' };

    return { message: 'school deleted successfully' };
  }
}
