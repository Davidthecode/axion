module.exports = {
  createClassroom: [
    {
      model: 'name',
      required: true,
    },
    {
      model: 'number',
      path: 'capacity',
    }
  ],
  updateClassroom: [
    {
      model: 'name',
    },
    {
      model: 'number',
      path: 'capacity',
    }
  ],
}
