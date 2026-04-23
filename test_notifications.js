// Test script to verify notification system
// Run this in browser console on any page after logging in as scrap dealer

async function testNotifications() {
    console.log('=== Testing Notification System ===\n');
    
    // Get current user
    const sessionUser = sessionStorage.getItem('user');
    if (!sessionUser) {
        console.error('❌ No user logged in. Please log in first.');
        return;
    }
    
    const user = JSON.parse(sessionUser);
    console.log('✓ Current user:', user.user_id, 'Role:', user.role);
    
    // Test 1: Check if scrap dealers exist
    console.log('\n--- Test 1: Checking scrap dealers ---');
    try {
        const { data: dealers, error } = await supabaseClient
            .from('users')
            .select('user_id, "First name", "Last_Name", email_address')
            .eq('role', 'ScrapDealer');
            
        if (error) {
            console.error('❌ Error fetching dealers:', error);
        } else {
            console.log(`✓ Found ${dealers?.length || 0} scrap dealers`);
            if (dealers?.length > 0) {
                console.log('  Dealer IDs:', dealers.map(d => d.user_id));
            }
        }
    } catch (e) {
        console.error('❌ Exception:', e);
    }
    
    // Test 2: Check if user can read notifications table
    console.log('\n--- Test 2: Testing notifications table access ---');
    try {
        const { data: notifs, error } = await supabaseClient
            .from('notifications')
            .select('*')
            .eq('user_id', user.user_id)
            .limit(5);
            
        if (error) {
            console.error('❌ Error reading notifications:', error);
            console.error('   Code:', error.code);
            console.error('   Message:', error.message);
        } else {
            console.log(`✓ Can read notifications. Found ${notifs?.length || 0} notifications.`);
        }
    } catch (e) {
        console.error('❌ Exception:', e);
    }
    
    // Test 3: Try to insert a test notification
    console.log('\n--- Test 3: Testing notification insert ---');
    try {
        const { data, error } = await supabaseClient
            .from('notifications')
            .insert({
                user_id: user.user_id,
                message: 'Test notification from debug script',
                type: 'system',
                is_read: false,
                data: { test: true, timestamp: new Date().toISOString() }
            })
            .select();
            
        if (error) {
            console.error('❌ Error inserting notification:', error);
            console.error('   Code:', error.code);
            console.error('   Message:', error.message);
            console.error('   Hint:', error.hint);
        } else {
            console.log('✓ Successfully inserted test notification!');
            console.log('  Notification ID:', data?.[0]?.id);
        }
    } catch (e) {
        console.error('❌ Exception:', e);
    }
    
    // Test 4: Check industry_order table
    console.log('\n--- Test 4: Checking industry_order table ---');
    try {
        const { data: orders, error } = await supabaseClient
            .from('industry_order')
            .select('*')
            .limit(3);
            
        if (error) {
            console.error('❌ Error reading orders:', error);
        } else {
            console.log(`✓ Found ${orders?.length || 0} orders in industry_order table`);
            if (orders?.length > 0) {
                console.log('  Sample order:', orders[0].order_id, orders[0].material_type);
            }
        }
    } catch (e) {
        console.error('❌ Exception:', e);
    }
    
    console.log('\n=== Test Complete ===');
}

// Make it available globally
window.testNotifications = testNotifications;

console.log('Test script loaded! Run testNotifications() to test the notification system.');
