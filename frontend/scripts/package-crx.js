#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function packageExtension() {
	const distPath = path.join(__dirname, '../dist');
	const keyPath = path.join(__dirname, '../promptab-extension.pem');
	const crxPath = path.join(__dirname, '../promptab-extension.crx');
	const zipPath = path.join(__dirname, '../promptab-extension.zip');

	console.log('🔧 Packaging PrompTab Chrome Extension...');

	// Check if dist directory exists
	if (!fs.existsSync(distPath)) {
		console.error('❌ Error: dist directory not found. Please run "npm run build" first.');
		process.exit(1);
	}

	try {
		// Create ZIP file first (for development)
		console.log('📦 Creating ZIP file...');
		await createZipFile(distPath, zipPath);

		// Create CRX file (for distribution)
		console.log('🔐 Creating CRX file...');
		await createCrxFile(distPath, keyPath, crxPath);

		console.log('✅ Extension packaged successfully!');
		console.log('');
		console.log('📄 Files created:');
		console.log(`  ZIP: ${zipPath}`);
		console.log(`  CRX: ${crxPath}`);
		console.log(`  Key: ${keyPath}`);
		console.log('');
		console.log('🚀 Installation options:');
		console.log('  For development: Load unpacked extension from dist/ folder');
		console.log('  For testing: Drag and drop the .crx file onto chrome://extensions/');
		console.log('  For distribution: Use the .zip file for Chrome Web Store');
		console.log('');
		console.log('⚠️  Keep the .pem file safe - it\'s needed for updates!');

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
			const stats = fs.statSync(zipPath);
			const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
			console.log(`✅ ZIP file created: ${fileSizeInMB} MB`);
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

async function createCrxFile(distPath, keyPath, crxPath) {
	try {
		// Generate private key if it doesn't exist
		if (!fs.existsSync(keyPath)) {
			console.log('🔑 Generating private key...');
			const { execSync } = require('child_process');

			try {
				// Use OpenSSL to generate private key
				execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
				console.log('✅ Private key generated and saved to promptab-extension.pem');
			} catch (error) {
				console.error('❌ Error generating private key. Please install OpenSSL or create key manually.');
				console.log('To create key manually, run: openssl genrsa -out promptab-extension.pem 2048');
				throw error;
			}
		}

		// Try to create CRX file
		try {
			const crx3 = require('crx3');
			const privateKey = fs.readFileSync(keyPath, 'utf8');

			const crxBuffer = await crx3([distPath], {
				keyPath: keyPath
			});

			fs.writeFileSync(crxPath, crxBuffer);

			const stats = fs.statSync(crxPath);
			const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
			console.log(`✅ CRX file created: ${fileSizeInMB} MB`);

		} catch (crxError) {
			console.warn('⚠️  CRX creation failed, but ZIP file is available for manual installation');
			console.log('You can load the extension from the dist/ folder in Chrome Developer mode');
			console.log('CRX Error:', crxError.message);
		}

	} catch (error) {
		console.warn('⚠️  CRX creation failed:', error.message);
		console.log('The ZIP file is still available for manual installation.');
	}
}

// Run the packaging
packageExtension(); 