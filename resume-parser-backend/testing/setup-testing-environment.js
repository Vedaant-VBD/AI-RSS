#!/usr/bin/env node

/**
 * Setup Testing Environment
 * Checks and sets up all requirements for accuracy testing
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestingEnvironmentSetup {
  constructor() {
    this.checks = [];
    this.fixes = [];
  }

  async runSetup() {
    console.log('🔧 Setting up testing environment...\n');

    // 1. Check Node.js dependencies
    await this.checkNodeDependencies();
    
    // 2. Check Python environment
    await this.checkPythonEnvironment();
    
    // 3. Check embedding service
    await this.checkEmbeddingService();
    
    // 4. Check database connection
    await this.checkDatabaseConnection();
    
    // 5. Generate summary
    this.generateSetupSummary();
  }

  async checkNodeDependencies() {
    console.log('📦 Checking Node.js dependencies...');
    
    const requiredPackages = [
      'mongoose', 'bcrypt', 'jsonwebtoken', 'express', 
      'cors', 'multer', 'mongodb', 'dotenv'
    ];
    
    const packageJson = JSON.parse(fs.readFileSync('../package.json', 'utf8'));
    const installedPackages = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {}
    };
    
    const missing = [];
    for (const pkg of requiredPackages) {
      if (!installedPackages[pkg]) {
        missing.push(pkg);
      } else {
        console.log(`   ✅ ${pkg} - installed`);
      }
    }
    
    if (missing.length > 0) {
      console.log(`   ❌ Missing packages: ${missing.join(', ')}`);
      this.fixes.push(`Run: npm install ${missing.join(' ')}`);
    } else {
      console.log('   ✅ All Node.js dependencies are installed');
    }
    
    this.checks.push({
      name: 'Node.js Dependencies',
      status: missing.length === 0 ? 'pass' : 'fail',
      details: missing.length === 0 ? 'All packages installed' : `Missing: ${missing.join(', ')}`
    });
  }

  async checkPythonEnvironment() {
    console.log('\n🐍 Checking Python environment...');
    
    return new Promise((resolve) => {
      // Check if Python is available
      const python = spawn('python', ['--version'], { stdio: 'pipe' });
      
      python.on('close', (code) => {
        if (code === 0) {
          console.log('   ✅ Python is available');
          this.checkPythonPackages();
        } else {
          console.log('   ❌ Python not found');
          this.fixes.push('Install Python 3.7+ from https://python.org');
          this.checks.push({
            name: 'Python Environment',
            status: 'fail',
            details: 'Python not found'
          });
        }
        resolve();
      });
      
      python.on('error', () => {
        console.log('   ❌ Python not found');
        this.fixes.push('Install Python 3.7+ from https://python.org');
        this.checks.push({
          name: 'Python Environment',
          status: 'fail',
          details: 'Python not found'
        });
        resolve();
      });
    });
  }

  async checkPythonPackages() {
    console.log('   Checking Python packages...');
    
    return new Promise((resolve) => {
      const pip = spawn('pip', ['list'], { stdio: 'pipe' });
      let output = '';
      
      pip.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      pip.on('close', (code) => {
        if (code === 0) {
          const hasSentenceTransformers = output.includes('sentence-transformers');
          const hasTorch = output.includes('torch');
          
          if (hasSentenceTransformers && hasTorch) {
            console.log('   ✅ Required Python packages are installed');
            this.checks.push({
              name: 'Python Packages',
              status: 'pass',
              details: 'sentence-transformers and torch installed'
            });
          } else {
            console.log('   ❌ Missing Python packages');
            this.fixes.push('Run: pip install sentence-transformers torch');
            this.checks.push({
              name: 'Python Packages',
              status: 'fail',
              details: 'Missing sentence-transformers or torch'
            });
          }
        } else {
          console.log('   ❌ Could not check Python packages');
          this.checks.push({
            name: 'Python Packages',
            status: 'unknown',
            details: 'Could not run pip list'
          });
        }
        resolve();
      });
    });
  }

  async checkEmbeddingService() {
    console.log('\n🤖 Checking embedding service...');
    
    try {
      const embeddingService = require('../embedding-service');
      
      // Test with simple text
      const testText = "This is a test sentence for embedding generation.";
      console.log('   Testing embedding generation...');
      
      const embedding = await embeddingService.generateEmbedding(testText);
      
      if (embedding && Array.isArray(embedding) && embedding.length > 0) {
        console.log(`   ✅ Embedding service working (${embedding.length} dimensions)`);
        this.checks.push({
          name: 'Embedding Service',
          status: 'pass',
          details: `Working with ${embedding.length} dimensions`
        });
      } else {
        console.log('   ❌ Embedding service returned invalid result');
        this.checks.push({
          name: 'Embedding Service',
          status: 'fail',
          details: 'Invalid embedding result'
        });
      }
      
    } catch (error) {
      console.log(`   ❌ Embedding service failed: ${error.message}`);
      this.fixes.push('Check Python environment and sentence-transformers installation');
      this.checks.push({
        name: 'Embedding Service',
        status: 'fail',
        details: error.message
      });
    }
  }

  async checkDatabaseConnection() {
    console.log('\n🗄️ Checking database connection...');
    
    try {
      const mongoose = require('mongoose');
      
      // Try to connect to MongoDB
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_parser';
      
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000
      });
      
      console.log('   ✅ Database connection successful');
      this.checks.push({
        name: 'Database Connection',
        status: 'pass',
        details: 'MongoDB connected successfully'
      });
      
      await mongoose.disconnect();
      
    } catch (error) {
      console.log(`   ❌ Database connection failed: ${error.message}`);
      this.fixes.push('Check MongoDB connection string in .env file');
      this.checks.push({
        name: 'Database Connection',
        status: 'fail',
        details: error.message
      });
    }
  }

  generateSetupSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 TESTING ENVIRONMENT SETUP SUMMARY');
    console.log('='.repeat(60));
    
    const passed = this.checks.filter(c => c.status === 'pass').length;
    const failed = this.checks.filter(c => c.status === 'fail').length;
    const unknown = this.checks.filter(c => c.status === 'unknown').length;
    
    console.log(`\n📊 Status: ${passed} passed, ${failed} failed, ${unknown} unknown`);
    
    console.log('\n📋 Detailed Results:');
    this.checks.forEach(check => {
      const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '❓';
      console.log(`   ${icon} ${check.name}: ${check.details}`);
    });
    
    if (this.fixes.length > 0) {
      console.log('\n🔧 Required Fixes:');
      this.fixes.forEach((fix, i) => {
        console.log(`   ${i + 1}. ${fix}`);
      });
    }
    
    if (failed === 0) {
      console.log('\n🎉 Environment is ready for accuracy testing!');
      console.log('   Run: npm run test-accuracy');
    } else {
      console.log('\n⚠️ Please fix the issues above before running accuracy tests.');
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  const setup = new TestingEnvironmentSetup();
  setup.runSetup().catch(console.error);
}

module.exports = TestingEnvironmentSetup;