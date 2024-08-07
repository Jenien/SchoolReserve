const getInventoryReport = async (req, res) => {
  try {
    const report = await req.prisma.inventory.findMany({
      where: req.query.where,
      include: { borrowers: true },
    });
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getScheduleReport = async (req, res) => {
  try {
    const report = await req.prisma.schedule.findMany({
      where: req.query.where,
      include: { room: true, item: true, user: true },
    });
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getInventoryReport,
  getScheduleReport,
};
