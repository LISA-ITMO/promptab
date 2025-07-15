#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function packageExtensionZip() {
	const distPath = path.join(__dirname, '../dist');
	const zipPath = path.join(__dirname, '../promptab-extension.zip');

	console.log('📦 Creating ZIP package for PrompTab Chrome Extension...');

	// Check if dist directory exists
	if (!fs.existsSync(distPath)) {
		console.error('❌ Error: dist directory not found. Please run "npm run build" first.');
		process.exit(1);
	}

	try {
		// Create ZIP file
		await createZipFile(distPath, zipPath);

		const stats = fs.statSync(zipPath);
		const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

		console.log('✅ Extension packaged successfully!');
		console.log(`📄 ZIP file: ${zipPath}`);
		console.log(`📏 File size: ${fileSizeInMB} MB`);
		console.log('');
		console.log('🚀 Installation options:');
		console.log('1. For development: Load unpacked extension from dist/ folder');
		console.log('2. For Chrome Web Store: Upload the .zip file');
		console.log('3. For manual installation: Extract .zip and load unpacked');

	} catch (error) {
		console.error('❌ Error packaging extension:', error);
		process.exit(1);
	}
}

async function createZipFile(distPath, zipPath) {
	return new Promise((resolve, reject) => {
		const output = fs.createWriteStream(zipPath);
		const archive = archiver('zip', {
			zlib: { level: 9 } // Best compression
		});

		output.on('close', () => {
			resolve();
		});

		archive.on('error', (err) => {
			reject(err);
		});

		archive.pipe(output);
		archive.directory(distPath, false);
		archive.finalize();
	});
}

// Run the packaging
packageExtensionZip(); 