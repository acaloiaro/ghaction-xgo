import * as download from 'download';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as child_process from 'child_process';
import * as core from '@actions/core';
import * as exec from '@actions/exec';

async function run() {
  try {
    const workspace = process.env['GITHUB_WORKSPACE'] || '.';
    const xgo_version = '0.3.2';
    const go_version = core.getInput('go_version');
    const dest = core.getInput('dest');
    const prefix = core.getInput('prefix');
    const targets = core.getInput('targets');
    const v = core.getInput('v');
    const x = core.getInput('x');
    const ldflags = core.getInput('ldflags');

    console.log('⬇️ Downloading xgo...');
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'xgo-'));
    await download.default(
      `https://github.com/crazy-max/xgo/releases/download/v${xgo_version}/xgo_linux_amd64`,
      tmpdir,
      {filename: 'xgo'}
    );
    const xgo_path = `${tmpdir}/xgo`;
    fs.chmodSync(xgo_path, '755');

    // Run xgo
    let args: Array<string> = [];
    if (go_version) {
      args.push('-go', go_version);
    }
    if (prefix) {
      args.push('-out', prefix);
    }
    if (dest) {
      args.push('-dest', dest);
    }
    if (targets) {
      args.push('-targets', targets);
    }
    if (/true/i.test(v)) {
      args.push('-v');
    }
    if (/true/i.test(x)) {
      args.push('-x');
    }
    if (ldflags) {
      args.push('-ldflags', ldflags);
    }
    args.push(workspace);
    await exec.exec(xgo_path, args);

    console.log('🔨 Fixing perms...');
    const uid = parseInt(
      child_process.execSync(`id -u`, {encoding: 'utf8'}).trim()
    );
    const gid = parseInt(
      child_process.execSync(`id -g`, {encoding: 'utf8'}).trim()
    );
    await exec.exec('sudo', ['chown', '-R', `${uid}:${gid}`, workspace]);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
