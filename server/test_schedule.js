const LockedSlot = require('./src/models/LockedSlot');
const { DEFAULT_SLOTS } = require('./src/controllers/doctorSchedule.controller');

console.log('Testing Model:');
console.log('LockedSlot schema defined correctly:', !!LockedSlot.schema);
console.log('DEFAULT_SLOTS count:', DEFAULT_SLOTS.length);

console.log('ALL SYNTAX & IMPORTS SUCCESSFUL');
