/**
 * Tests for StudentsManager covering two key scenarios from the assessment:
 *  - School Admin cannot see students from another school (tenancy isolation)
 *  - transferStudent fails when the destination classroom is at full capacity
 *
 * Approach: We test the manager layer directly (rather than through HTTP via supertest)
 * to keep tests fast and free of external service dependencies (MongoDB, Redis).
 * This is equivalent to integration testing the business logic with full control over inputs and assertions.
 */

const StudentsManager = require('../managers/students/Students.manager');
const mongoose = require('mongoose');

/* Mock mongoose session/transaction so transferStudent doesn't need a real DB */
const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn().mockResolvedValue(undefined),
  abortTransaction: jest.fn().mockResolvedValue(undefined),
  endSession: jest.fn(),
};
jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);

/** Build a minimal __schooladmin token payload */
const makeAdmin = (schoolId) => ({ userId: 'admin1', role: 'schooladmin', schoolId });

/** Build a fake Mongoose document with a .save() stub */
const makeDoc = (data) => ({ ...data, save: jest.fn().mockResolvedValue(true) });


let manager;
let mockMongomodels;
let mockValidators;

beforeEach(() => {
  mockMongomodels = {
    student: {
      findOne: jest.fn(),
      countDocuments: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn(),
    },
    classroom: {
      findOne: jest.fn(),
    },
  };

  mockValidators = {
    students: {
      enrollStudent: jest.fn().mockResolvedValue(null),
      updateStudent: jest.fn().mockResolvedValue(null),
      transferStudent: jest.fn().mockResolvedValue(null),
    },
  };

  manager = new StudentsManager({
    config: {},
    managers: {},
    mongomodels: mockMongomodels,
    validators: mockValidators,
  });
});

describe('StudentsManager — Multi-Tenancy & Business Logic', () => {

  /**
   * Test for tenancy isolation
   * A School Admin must only see students belonging to their own school.
   * The query always scopes by schoolId, so a cross-school lookup returns null.
   */
  test('School Admin cannot see students from another school', async () => {
    const school1Id = 'school-id-1';
    const school2Id = 'school-id-2';
    const studentId = 'student-id-1';

    /** 
     * school2 admin tries to find a student that belongs to school1 
     * findOne with { _id: studentId, schoolId: school2Id } returns null
     */
    mockMongomodels.student.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const school2Admin = makeAdmin(school2Id);
    const result = await manager.getStudent({ __schooladmin: school2Admin, studentId });

    /** Must get 404 — student belongs to school1, not school2 */
    expect(result).toEqual({ ok: false, code: 404, errors: 'student not found' });

    /** Verify the query was scoped to school2's ID */
    expect(mockMongomodels.student.findOne).toHaveBeenCalledWith({
      _id: studentId,
      schoolId: school2Id,
    });
  });

  /**
   * Test for capacity enforcement during transfer
   * transferStudent must reject if the destination classroom has no free slots.
   */
  test('transferStudent fails when destination classroom is at full capacity', async () => {
    const schoolId = 'school-id-1';
    const studentId = 'student-id-1';
    const classroomId = 'classroom-id-1';

    const schoolAdmin = makeAdmin(schoolId);

    /** Student exists in this school */
    const fakeStudent = makeDoc({ _id: studentId, schoolId, classroomId: null });
    mockMongomodels.student.findOne.mockReturnValue({
      session: jest.fn().mockResolvedValue(fakeStudent),
    });

    /** Classroom exists in this school, capacity = 1 */
    const fakeClassroom = { _id: classroomId, schoolId, capacity: 1, name: 'Room A' };
    mockMongomodels.classroom.findOne.mockReturnValue({
      session: jest.fn().mockResolvedValue(fakeClassroom),
    });

    /* Classroom already has 1 student meaning it's full */
    mockMongomodels.student.countDocuments.mockReturnValue({
      session: jest.fn().mockResolvedValue(1),
    });

    const result = await manager.transferStudent({
      __schooladmin: schoolAdmin,
      studentId,
      newClassroomId: classroomId,
    });

    expect(result).toEqual({ ok: false, code: 400, errors: 'classroom is at full capacity' });
  });

});
