import { supabase } from '../lib/supabase'

async function createAdminUser() {
  try {
    console.log('Creating admin user...')
    
    // Step 1: Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'admin@admin',
      password: 'admin123!',
    })

    if (authError) {
      console.error('Failed to create auth user:', authError)
      return
    }

    if (!authData.user) {
      console.error('No user data returned from auth signup')
      return
    }

    console.log('Auth user created successfully:', authData.user.id)

    // Step 2: Create profile record with admin role
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        email: 'admin@admin',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        is_active: true
      })
      .select()
      .single()

    if (profileError) {
      console.error('Failed to create profile:', profileError)
      return
    }

    console.log('Profile created successfully:', profileData)
    console.log('Admin user setup complete!')
    console.log('Email: admin@admin')
    console.log('Password: admin123!')
    console.log('Role: admin')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the script if called directly
if (require.main === module) {
  createAdminUser()
}

export { createAdminUser }
