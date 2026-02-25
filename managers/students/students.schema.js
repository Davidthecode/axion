module.exports = {
  enrollStudent: [
    {
      model: 'name',
      required: true,
    },
    {
      model: 'number',
      path: 'age',
    },
    {
      model: 'email',
    }
  ],
  updateStudent: [
    {
      model: 'name',
    },
    {
      model: 'number',
      path: 'age',
    },
    {
      model: 'email',
    }
  ],
  transferStudent: [
    {
      model: 'id',
      path: 'studentId',
      required: true,
    },
    {
      model: 'id',
      path: 'newClassroomId',
      required: true,
    }
  ]
}
