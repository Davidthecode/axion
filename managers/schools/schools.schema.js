module.exports = {
  createSchool: [
    {
      model: 'name',
      required: true,
    },
    {
      model: 'email',
    },
    {
      model: 'phone',
    },
    {
      model: 'text',
      path: 'address',
    }
  ],
  updateSchool: [
    {
      model: 'name',
    },
    {
      model: 'email',
    },
    {
      model: 'phone',
    },
    {
      model: 'text',
      path: 'address',
    }
  ],
}
