require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Ensure backend .env is loaded if script runs from repo root
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (_) {}

const User = require('../models/User');

async function main() {
  const args = process.argv.slice(2);
  const email = args.find((a) => !a.startsWith('--'));
  const nameArg = getArgValue(args, '--name');
  const passwordArg = getArgValue(args, '--password');
  const roleArg = getArgValue(args, '--role') || 'admin';
  const validRoles = ['superadmin', 'admin', 'user'];

  if (!email) {
    console.error('Uso: node backend/scripts/promoteAdmin.js <email> [--name "Nombre"] [--password "123456"] [--role superadmin|admin|user]');
    process.exit(1);
  }
  if (!validRoles.includes(roleArg)) {
    console.error(`Rol inválido: ${roleArg}. Opciones: ${validRoles.join(', ')}`);
    process.exit(1);
  }
  if (!isValidEmail(email)) {
    console.error(`Email inválido: ${email}`);
    process.exit(1);
  }

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/empleados_db';
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    console.log(`[DB] Conectado a MongoDB: ${mongoUri}`);

    let user = await User.findOne({ email });
    if (!user) {
      const nombre = nameArg || 'Admin';
      const rawPassword = passwordArg || process.env.ADMIN_SEED_PASSWORD || '123456';
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(rawPassword, salt);
      user = new User({ nombre, email, password: hashed, role: roleArg });
      await user.save();
      console.log(`[OK] Usuario creado con rol "${roleArg}": ${email}`);
      console.log(`[INFO] Credenciales -> email: ${email} / password: ${rawPassword}`);
    } else {
      if (user.role !== roleArg) {
        const prevRole = user.role;
        user.role = roleArg;
        await user.save();
        console.log(`[OK] Rol actualizado: ${email} — ${prevRole} → ${roleArg}`);
      } else {
        console.log(`[INFO] El usuario ya tiene rol "${roleArg}": ${email}`);
      }
      if (passwordArg) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(passwordArg, salt);
        await user.save();
        console.log('[OK] Password actualizado.');
      }
    }
  } catch (err) {
    console.error('[ERROR] No se pudo completar la operación:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

function getArgValue(args, key) {
  const idx = args.findIndex((a) => a === key);
  if (idx === -1) return null;
  return args[idx + 1] || null;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

main();