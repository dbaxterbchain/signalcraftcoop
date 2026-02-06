const { spawn } = require('child_process');

exports.handler = async () => {
  const exitCode = await new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
      { stdio: 'inherit', env: process.env, cwd: __dirname },
    );
    child.on('close', resolve);
  });

  if (exitCode !== 0) {
    throw new Error(`prisma migrate deploy failed with exit code ${exitCode}`);
  }

  return { ok: true };
};
