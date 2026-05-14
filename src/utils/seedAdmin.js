import User from '../models/User.js';

const seedAdmin = async () => {
  try {
    // Check if any admin exists
    const adminExists = await User.findOne({ role: 'admin' });

    if (!adminExists) {
      console.log('No super admin found in database. Initializing default admin...');
      
      const adminData = {
        name: 'Super Admin',
        username: 'admin',
        email: process.env.ADMIN_EMAIL || 'admin@hamrodoctor.com',
        phone: process.env.ADMIN_PHONE || '9800000000',
        password: process.env.ADMIN_PASSWORD || 'Admin@123',
        role: 'admin',
        isVerified: true
      };

      // Create the admin
      // Note: The pre-save hook in User.js will handle password hashing
      await User.create(adminData);
      
      console.log('✅ Default Super Admin created successfully!');
      console.log('-------------------------------------------');
      console.log(`Email:    ${adminData.email}`);
      console.log(`Phone:    ${adminData.phone}`);
      console.log(`Password: ${adminData.password}`);
      console.log('-------------------------------------------');
      console.log('IMPORTANT: Please change this password after your first login.');
    }
  } catch (error) {
    console.error('❌ Error seeding super admin:', error.message);
  }
};

export default seedAdmin;
