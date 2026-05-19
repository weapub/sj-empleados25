const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  apellido: {
    type: String,
    required: true,
    trim: true
  },
  dni: {
    type: String,
    trim: true,
    unique: true,
  },
  legajo: {
    type: String,
    trim: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  telefono: {
    type: String,
    trim: true
  },
  puesto: {
    type: String,
    required: true
  },
  departamento: {
    type: String,
    required: true
  },
  salario: {
    type: Number,
    required: true
  },
  fechaContratacion: {
    type: Date,
    default: Date.now
  },
  activo: {
    type: Boolean,
    default: true
  },
  cuit: {
    type: String,
    trim: true
  },
  fechaIngreso: {
    type: Date
  },
  fechaRegistroARCA: {
    type: Date
  },
  fechaNacimiento: {
    type: Date
  },
  lugarNacimiento: {
    type: String,
    trim: true
  },
  domicilio: {
    type: String,
    trim: true
  },
  sucursal: {
    type: String,
    trim: true
  },
  fechaBaja: {
    type: Date
  },
  motivoBaja: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Generar legajo automáticamente: 'SJ-DNINUMERICO'
employeeSchema.pre('save', function(next) {
  if (this.dni) {
    const numericDni = String(this.dni).replace(/\D/g, '');
    this.legajo = `SJ-${numericDni}`;
  }
  next();
});

// Índices útiles para conteos y ordenaciones
employeeSchema.index({ activo: 1 });
employeeSchema.index({ apellido: 1, nombre: 1 });

module.exports = mongoose.model('Employee', employeeSchema);