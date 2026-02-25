module.exports = class ClassroomsManager {
  constructor({ config, managers, mongomodels, validators }) {
    this.config = config;
    this.mongomodels = mongomodels;
    this.validators = validators;
    this.httpExposed = [
      'post=createClassroom',
      'get=getClassrooms',
      'get=getClassroom',
      'patch=updateClassroom',
      'delete=deleteClassroom'
    ];
  }

  async createClassroom({ __schooladmin, name, capacity, resources }) {
    if (!__schooladmin) return { ok: false, code: 401, errors: 'unauthorized' };

    const validate = await this.validators.classrooms.createClassroom({ name, capacity, resources });
    if (validate) return { ok: false, code: 400, errors: validate };

    const classroom = await this.mongomodels.classroom.create({
      name,
      capacity,
      resources,
      schoolId: __schooladmin.schoolId
    });

    return { classroom };
  }

  async getClassrooms({ __schooladmin }) {
    if (!__schooladmin) return { ok: false, code: 401, errors: 'unauthorized' };

    const classrooms = await this.mongomodels.classroom.find({ schoolId: __schooladmin.schoolId });
    return { classrooms };
  }

  async getClassroom({ __schooladmin, classroomId }) {
    if (!__schooladmin) return { ok: false, code: 401, errors: 'unauthorized' };

    const classroom = await this.mongomodels.classroom.findOne({ _id: classroomId, schoolId: __schooladmin.schoolId });
    if (!classroom) return { ok: false, code: 404, errors: 'classroom not found' };

    return { classroom };
  }

  async updateClassroom({ __schooladmin, classroomId, name, capacity, resources }) {
    if (!__schooladmin) return { ok: false, code: 401, errors: 'unauthorized' };

    const validate = await this.validators.classrooms.updateClassroom({ name, capacity, resources });
    if (validate) return { ok: false, code: 400, errors: validate };

    const classroom = await this.mongomodels.classroom.findOneAndUpdate(
      { _id: classroomId, schoolId: __schooladmin.schoolId },
      { name, capacity, resources },
      { new: true }
    );

    if (!classroom) return { ok: false, code: 404, errors: 'classroom not found' };
    return { classroom };
  }

  async deleteClassroom({ __schooladmin, classroomId }) {
    if (!__schooladmin) return { ok: false, code: 401, errors: 'unauthorized' };

    const classroom = await this.mongomodels.classroom.findOneAndDelete({ _id: classroomId, schoolId: __schooladmin.schoolId });
    if (!classroom) return { ok: false, code: 404, errors: 'classroom not found' };

    return { message: 'classroom deleted successfully' };
  }
}
