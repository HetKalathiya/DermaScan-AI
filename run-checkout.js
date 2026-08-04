const { execSync } = require('child_process');
try {
  const out = execSync('git checkout -- "src/components/Dashboard.tsx" "src/components/common/ConsultationChat.tsx"').toString();
  console.log('Success:', out);
} catch (e) {
  console.log('Error:', e.message);
}
