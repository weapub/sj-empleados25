require('dotenv').config();
const mongoose = require('mongoose');

// Cargar esquemas desde modelos existentes
const UserModel = require('../models/User');
const EmployeeModel = require('../models/Employee');
const AttendanceModel = require('../models/Attendance');
const DisciplinaryModel = require('../models/Disciplinary');
const EmployeeAccountModel = require('../models/EmployeeAccount');
const EmployeeAccountTxModel = require('../models/EmployeeAccountTransaction');
const EmployeeEventModel = require('../models/EmployeeEvent');
const PayrollReceiptModel = require('../models/PayrollReceipt');
const PresentismoRecipientModel = require('../models/PresentismoRecipient');

const schemas = {
  User: UserModel.schema,
  Employee: EmployeeModel.schema,
  Attendance: AttendanceModel.schema,
  Disciplinary: DisciplinaryModel.schema,
  EmployeeAccount: EmployeeAccountModel.schema,
  EmployeeAccountTransaction: EmployeeAccountTxModel.schema,
  EmployeeEvent: EmployeeEventModel.schema,
  PayrollReceipt: PayrollReceiptModel.schema,
  PresentismoRecipient: PresentismoRecipientModel.schema,
};

async function migrate() {
  const baseUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const srcDbName = process.env.SRC_DB || 'test';
  const dstDbName = process.env.DST_DB || 'empleados_db';

  await mongoose.connect(baseUri, { serverSelectionTimeoutMS: 6000, connectTimeoutMS: 6000 });
  const connDefault = mongoose.connection;
  const connSrc = connDefault.useDb(srcDbName, { useCache: true });
  const connDst = connDefault.useDb(dstDbName, { useCache: true });

  const report = { baseUri, srcDbName, dstDbName, collections: {} };

  for (const [name, schema] of Object.entries(schemas)) {
    const SrcModel = connSrc.model(name, schema);
    const DstModel = connDst.model(name, schema);

    const docs = await SrcModel.find({}).lean();
    const srcCount = docs.length;
    let inserted = 0;
    let failed = 0;

    if (srcCount > 0) {
      try {
        const res = await DstModel.insertMany(docs, { ordered: false });
        inserted = Array.isArray(res) ? res.length : 0;
      } catch (e) {
        // Cuando hay duplicados, insertMany con ordered:false continúa, pero cuenta los que entraron.
        // No siempre devuelve la cantidad exacta; hacemos un recount en destino.
      }
      const dstCountAfter = await DstModel.countDocuments();
      // Aproximación de fallidos si existían duplicados
      failed = Math.max(0, srcCount - (dstCountAfter));
    }

    report.collections[name] = { srcCount, inserted, failed };
  }

  console.log('[DB MIGRATE REPORT]', JSON.stringify(report, null, 2));
  await mongoose.disconnect();
}

migrate().catch(async (e) => {
  console.error('[ERROR] migrateDb:', e.message);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});