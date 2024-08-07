const prisma = require('../libs/prisma');

const createItem = async (req, res, next) => {
  try {
    const {
      itemCode,
      name,
      location,
      initialQuantity,
      condition,
      category,
      supplier,
      purchasePrice,
      purchaseDate,
    } = req.body;
    const userMakingRequest = req.user;

    // Periksa apakah pengguna yang membuat permintaan adalah admin
    if (userMakingRequest.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create items' });
    }

    // Buat item baru dalam inventaris
    const inventory = await prisma.inventory.create({
      data: {
        itemCode,
        name,
        location,
        initialQuantity,
        condition,
        category,
        supplier,
        purchasePrice,
        purchaseDate,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Inventory created successfully',
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
};

// Get all inventory with filters deletedAt = null and initialQuantity > 0 and initialQuantity > rentedQuantity
const getItems = async (req, res, next) => {
  try {
    const items = await prisma.$queryRaw`
      SELECT * FROM "Inventory"
      WHERE "deletedAt" IS NULL
      AND "initialQuantity" > 0
      AND "initialQuantity" > "rentedQuantity"
    `;
    res.status(200).json({
      success: true,
      message: "items fetched successfully",
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

// Get all inventory with filters deletedAt = null and initialQuantity > 0 and initialQuantity > rentedQuantity
const getItemsRented = async (req, res, next) => {
  try {
    const items = await prisma.$queryRaw`
      SELECT i.*, 
             ir.id AS "ir_id", ir."inventoryId", ir."userId", ir.quantity, ir."startTime", ir."endTime", ir.condition AS "ir_condition", ir.notes, ir."createdAt" AS "ir_createdAt", ir."updatedAt" AS "ir_updatedAt", 
             u."userId" AS "u_userId", u.username, u.nip, u.email, u.role, u."deletedAt" AS "u_deletedAt", u."createdAt" AS "u_createdAt", u."updatedAt" AS "u_updatedAt"
      FROM "Inventory" i
      LEFT JOIN "InventoryRent" ir ON ir."inventoryId" = i.id
      LEFT JOIN "User" u ON u."userId" = ir."userId"
      WHERE i."deletedAt" IS NULL
      AND i."rentedQuantity" > 0;
    `;

    // Proses hasil query untuk membentuk struktur JSON yang sesuai
    const groupedItems = items.reduce((acc, item) => {
      const inventoryId = item.id;

      if (!acc[inventoryId]) {
        acc[inventoryId] = {
          id: item.id,
          name: item.name,
          location: item.location,
          initialQuantity: item.initialQuantity,
          rentedQuantity: item.rentedQuantity,
          condition: item.condition,
          category: item.category,
          supplier: item.supplier,
          purchasePrice: item.purchasePrice,
          purchaseDate: item.purchaseDate,
          deletedAt: item.deletedAt,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          inventoryRents: []
        };
      }

      if (item.ir_id) {
        acc[inventoryId].inventoryRents.push({
          id: item.ir_id,
          inventoryId: item.inventoryId,
          userId: item.userId,
          quantity: item.quantity,
          startTime: item.startTime,
          endTime: item.endTime,
          condition: item.ir_condition,
          notes: item.notes,
          createdAt: item.ir_createdAt,
          updatedAt: item.ir_updatedAt,
          user: {
            userId: item.u_userId,
            username: item.username,
            email: item.email,
            nip: item.nip,
            role: item.role,
            deletedAt: item.u_deletedAt,
            createdAt: item.u_createdAt,
            updatedAt: item.u_updatedAt
          }
        });
      }

      return acc;
    }, {});

    const result = Object.values(groupedItems);

    res.status(200).json({
      success: true,
      message: "Items fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


// get all item
const getAllItems = async (req, res, next) => {
  try {

    const items = await prisma.inventory.findMany({
      where: {
        deletedAt: null,
      },
    });

    res.json(items);
  } catch (error) {
    next(error);
  }
};

// Get a single Inventory by ID
const getItemById = async (req, res, next) => {
  try {
    const inventory = await prisma.inventory.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
  });
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "inventory not found",
        data: null,
      });
    }
    res.status(200).json({
      success: true,
      message: "inventory fetched successfully",
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
}

const updateItem = async (req, res, next) => {
  try {
    const {
      itemCode,
      name,
      location,
      initialQuantity,
      rentedQuantity,
      condition,
      category,
      supplier,
      purchasePrice,
      purchaseDate,
    } = req.body;
    const userMakingRequest = req.user;

    // Periksa apakah pengguna yang membuat permintaan adalah admin
    if (userMakingRequest.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update items' });
    }

    // Update item dalam inventaris
    const inventory = await prisma.inventory.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        itemCode,
        name,
        location,
        initialQuantity,
        rentedQuantity,
        condition,
        category,
        supplier,
        purchasePrice,
        purchaseDate,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Inventory updated successfully',
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
};

const deleteItem = async (req, res, next) => {
  try {
    const userMakingRequest = req.user;
    // Periksa apakah pengguna yang membuat permintaan adalah admin
    if (userMakingRequest.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can update Items' });
    }
    const inventory = await prisma.inventory.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        deletedAt: new Date(),
      },
    });
    res.status(200).json({
      success: true,
      message: "Inventory deleted successfully",
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
};

// rent a Inventory
const startItemRent = async (req, res, next) => {
  try {
    const { userId, quantity, condition, notes } = req.body;
    const inventoryId = parseInt(req.params.id);

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
    });

    
    if (inventory.initialQuantity === 0) {
      return res.status(403).json({ error: 'Inventory cannot be rented as initial quantity is zero' });
    }
    if (inventory.initialQuantity - inventory.rentedQuantity < quantity) {
      return res.status(403).json({ error: 'Not enough inventory available' });
    }

    const rentedInventory = await prisma.inventoryRent.create({
      data: {
        inventoryId,
        userId: parseInt(userId),
        quantity,
        startTime: new Date(),
        condition,
        notes,
      },
      include: { user: true },
    });

    await prisma.inventory.update({
      where: { id: inventoryId },
      data: { rentedQuantity: inventory.rentedQuantity + quantity },
    });

    res.status(200).json({
      success: true,
      message: "Inventory rented successfully",
      data: {
        ...rentedInventory,
        user: {
          name: rentedInventory.user.username, // Sertakan nama pengguna
          nip: rentedInventory.user.nip, // Sertakan nip pengguna
        },
        inventory: {
          name: inventory.name,
        }
      },
    });
  } catch (error) {
    next(error);
  }
};


// End a Inventory rent
const endItemRent = async (req, res, next) => {
  try {
    const { userId, quantity, condition, notes } = req.body;
    const inventoryId = parseInt(req.params.id);

    // Find all rent records for the specific inventory item and user
    const rentRecords = await prisma.inventoryRent.findMany({
      where: { inventoryId, userId, endTime: null }, // Only records not yet returned
      include: { user: true },
    });

    if (rentRecords.length === 0) {
      return res.status(404).json({ error: 'Rent record not found' });
    }

    // Calculate the total quantity rented
    const totalRentedQuantity = rentRecords.reduce((sum, record) => sum + record.quantity, 0);

    if (totalRentedQuantity < quantity) {
      return res.status(403).json({ error: 'Returned quantity exceeds rented quantity' });
    }

    // Update rent records
    await prisma.inventoryRent.updateMany({
      where: { id: { in: rentRecords.map(record => record.id) } },
      data: {
        endTime: new Date(),
        condition,
        notes
      },
    });

    // Update the inventory's rented quantity
    await prisma.inventory.update({
      where: { id: inventoryId },
      data: {
        rentedQuantity: { decrement: quantity }
      }
    });

    // Fetch updated inventory and user info
    const updatedInventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
    });

    const updatedRentRecords = await prisma.inventoryRent.findMany({
      where: { id: { in: rentRecords.map(record => record.id) } },
      include: { user: true }
    });

    res.status(200).json({
      success: true,
      message: "Inventory rent ended successfully",
      data: updatedRentRecords.map(record => ({
        id: record.id,
        user: {
          name: record.user.username,
          nip: record.user.nip,
        },
        inventory: {
          name: updatedInventory.name,
        },
        quantity: record.quantity,
        startTime: record.startTime,
        endTime: record.endTime,
        condition: record.condition,
        notes: record.notes,
      })),
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createItem,
  getItems,
  getItemsRented,
  getAllItems,
  updateItem,
  deleteItem,
  getItemById,
  startItemRent,
  endItemRent
};
