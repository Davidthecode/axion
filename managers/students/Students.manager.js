const mongoose = require('mongoose');

module.exports = class StudentsManager {
  constructor({ config, managers, mongomodels, validators }) {
    this.config = config;
    this.mongomodels = mongomodels;
    this.validators = validators;
    this.httpExposed = [
      'post=enrollStudent',
      'get=getStudents',
      'get=getStudent',
      'patch=updateStudent',
      'delete=deleteStudent',
      'post=transferStudent'
    ];
  }

  async enrollStudent({ __schooladmin, name, age, email, classroomId }) {
    if (!__schooladmin) return { ok: false, code: 401, errors: 'unauthorized' };

    const validate = await this.validators.students.enrollStudent({ name, age, email });
    if (validate) return { ok: false, code: 400, errors: validate };

    // check to verify classroom exists in this school and has capacity
    if (classroomId) {
      const classroom = await this.mongomodels.classroom.findOne({ _id: classroomId, schoolId: __schooladmin.schoolId });
      if (!classroom) return { ok: false, code: 404, errors: 'classroom not found' };

      const studentCount = await this.mongomodels.student.countDocuments({ classroomId });
      if (classroom.capacity && studentCount >= classroom.capacity) {
        return { ok: false, code: 400, errors: 'classroom is at full capacity' };
      }
    }

    const student = await this.mongomodels.student.create({
      name,
      age,
      email,
      schoolId: __schooladmin.schoolId,
      classroomId
    });

    return { student };
  }

  async getStudents({ __schooladmin }) {
    if (!__schooladmin) return { ok: false, code: 401, errors: 'unauthorized' };

    const students = await this.mongomodels.student.find({ schoolId: __schooladmin.schoolId }).populate('classroomId');
    return { students };
  }

  async getStudent({ __schooladmin, studentId }) {
    if (!__schooladmin) return { ok: false, code: 401, errors: 'unauthorized' };

    const student = await this.mongomodels.student.findOne({ _id: studentId, schoolId: __schooladmin.schoolId }).populate('classroomId');
    if (!student) return { ok: false, code: 404, errors: 'student not found' };

    return { student };
  }

  async updateStudent({ __schooladmin, studentId, name, age, email }) {
    if (!__schooladmin) return { ok: false, code: 401, errors: 'unauthorized' };

    const validate = await this.validators.students.updateStudent({ name, age, email });
    if (validate) return { ok: false, code: 400, errors: validate };

    const student = await this.mongomodels.student.findOneAndUpdate(
      { _id: studentId, schoolId: __schooladmin.schoolId },
      { name, age, email },
      { new: true }
    );

    if (!student) return { ok: false, code: 404, errors: 'student not found' };
    return { student };
  }

  async deleteStudent({ __schooladmin, studentId }) {
    if (!__schooladmin) return { ok: false, code: 401, errors: 'unauthorized' };

    const student = await this.mongomodels.student.findOneAndDelete({ _id: studentId, schoolId: __schooladmin.schoolId });
    if (!student) return { ok: false, code: 404, errors: 'student not found' };

    return { message: 'student deleted successfully' };
  }

  async transferStudent({ __schooladmin, studentId, newClassroomId }) {
    if (!__schooladmin) return { ok: false, code: 401, errors: 'unauthorized' };

    const validate = await this.validators.students.transferStudent({ studentId, newClassroomId });
    if (validate) return { ok: false, code: 400, errors: validate };

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // check to verify student exists in this school
      const student = await this.mongomodels.student.findOne({ _id: studentId, schoolId: __schooladmin.schoolId }).session(session);
      if (!student) {
        await session.abortTransaction();
        session.endSession();
        return { ok: false, code: 404, errors: 'student not found in your school' };
      }

      // check to verify new classroom exists in this school and has capacity
      const classroom = await this.mongomodels.classroom.findOne({ _id: newClassroomId, schoolId: __schooladmin.schoolId }).session(session);
      if (!classroom) {
        await session.abortTransaction();
        session.endSession();
        return { ok: false, code: 404, errors: 'destination classroom not found in your school' };
      }

      // check to verify new classroom has capacity
      const studentCount = await this.mongomodels.student.countDocuments({ classroomId: newClassroomId }).session(session);
      if (classroom.capacity && studentCount >= classroom.capacity) {
        await session.abortTransaction();
        session.endSession();
        return { ok: false, code: 400, errors: 'classroom is at full capacity' };
      }

      // perform transfer
      student.classroomId = newClassroomId;
      await student.save({ session });

      await session.commitTransaction();
      session.endSession();

      return { message: 'student transferred successfully', student };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      return { ok: false, code: 500, errors: 'transfer failed' };
    }
  }
}
