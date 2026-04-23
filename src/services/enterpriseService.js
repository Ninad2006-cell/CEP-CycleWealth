import supabaseClient from '../supabase-config';
import { notifyScrapDealersOfEnterpriseOrder } from './notificationService';

/**
 * Service for handling enterprise operations with Supabase
 */

/**
 * Create or get industry profile for a user
 * Schema: company_id references users(user_id)
 * @param {Object} profileData - Enterprise profile data
 * @returns {Promise<Object>} - The created/retrieved profile
 */
export const createOrGetIndustryProfile = async (profileData) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            throw new Error('User not authenticated');
        }

        // Check if profile exists using company_id (which equals user_id)
        const { data: existingProfile, error: fetchError } = await supabaseClient
            .from('industry_profile')
            .select('company_id')
            .eq('company_id', user.user_id)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
        }

        if (existingProfile) {
            return existingProfile;
        }

        // Parse budget to bigint
        let budgetValue = null;
        if (profileData.budgetRange) {
            const budgetMap = {
                '50k-1lakh': 75000,
                '1lakh-5lakh': 300000,
                '5lakh-10lakh': 750000,
                '10lakh+': 1000000
            };
            budgetValue = budgetMap[profileData.budgetRange] || null;
        }

        // Create new profile with company_id = user_id (FK constraint)
        const { data: newProfile, error: insertError } = await supabaseClient
            .from('industry_profile')
            .insert({
                company_id: user.user_id,
                company_name: profileData.companyName,
                industry_type: profileData.industryType,
                'Contact_person': profileData.contactPerson,
                email_address: profileData.email,
                phone_no: profileData.phone,
                company_size: profileData.companySize,
                'Budget': budgetValue
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return newProfile;
    } catch (error) {
        console.error('Error in createOrGetIndustryProfile:', error);
        throw error;
    }
};

/**
 * Get industry profile for current user
 * company_id is the foreign key to users(user_id)
 * @returns {Promise<Object|null>} - The profile or null
 */
export const getIndustryProfile = async () => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            throw new Error('User not authenticated');
        }

        const { data, error } = await supabaseClient
            .from('industry_profile')
            .select('*')
            .eq('company_id', user.user_id)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error in getIndustryProfile:', error);
        return null;
    }
};

/**
 * Create a new industry order
 * Schema matches: order_id, industry_id (unique), material_type, quantity, price,
 * delivery_details, City, PIN_code, Prefered_Delivery_Date, Person_name, phone_no
 * @param {Object} orderData - Order details
 * @returns {Promise<Object>} - The created order
 */
export const createIndustryOrder = async (orderData) => {
    try {
        const profile = await getIndustryProfile();
        if (!profile) {
            throw new Error('Industry profile not found. Please register first.');
        }

        const { data, error } = await supabaseClient
            .from('industry_order')
            .insert({
                industry_id: profile.company_id,
                material_type: orderData.materialType,
                quantity: parseFloat(orderData.quantity),
                price: orderData.price ? parseFloat(orderData.price) : null,
                delivery_details: orderData.deliveryDetails,
                'City': orderData.city,
                'PIN_code': orderData.pincode,
                'Prefered_Delivery_Date': orderData.preferredDate,
                'Person_name': orderData.personName,
                phone_no: orderData.phoneNo
            })
            .select()
            .single();

        if (error) throw error;

        // Notify all scrap dealers about this new order
        try {
            console.log('About to notify scrap dealers for order:', data.order_id);
            const notifyResult = await notifyScrapDealersOfEnterpriseOrder(data, profile.company_name);
            console.log('Notification result:', notifyResult);
            
            if (!notifyResult.success) {
                console.error('Notification failed:', notifyResult.error);
            } else if (notifyResult.sent === 0) {
                console.warn('No scrap dealers were notified - dealers list may be empty');
            } else {
                console.log(`Successfully notified ${notifyResult.sent} scrap dealers`);
            }
        } catch (notifyError) {
            console.error('Error notifying scrap dealers (non-critical):', notifyError);
            console.error('Full error:', JSON.stringify(notifyError, null, 2));
            // Don't throw - notification failure shouldn't block order creation
        }

        return data;
    } catch (error) {
        console.error('Error in createIndustryOrder:', error);
        throw error;
    }
};

/**
 * Get order for the current user's enterprise (one order per industry due to unique constraint)
 * @returns {Promise<Object|null>} - The order or null
 */
export const getIndustryOrder = async () => {
    try {
        const profile = await getIndustryProfile();
        if (!profile) {
            return null;
        }

        const { data, error } = await supabaseClient
            .from('industry_order')
            .select('*')
            .eq('industry_id', profile.company_id)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error in getIndustryOrder:', error);
        return null;
    }
};

/**
 * Delete an order
 * @param {string} orderId - UUID of the order to delete
 * @returns {Promise<boolean>} - Success status
 */
export const deleteIndustryOrder = async (orderId) => {
    try {
        const { error } = await supabaseClient
            .from('industry_order')
            .delete()
            .eq('order_id', orderId);

        if (error) throw error;

        return true;
    } catch (error) {
        console.error('Error in deleteIndustryOrder:', error);
        throw error;
    }
};

/**
 * Update industry profile
 * @param {Object} profileData - Updated profile data
 * @returns {Promise<Object>} - The updated profile
 */
export const updateIndustryProfile = async (profileData) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            throw new Error('User not authenticated');
        }

        // Parse budget to bigint
        let budgetValue = null;
        if (profileData.budgetRange) {
            const budgetMap = {
                '50k-1lakh': 75000,
                '1lakh-5lakh': 300000,
                '5lakh-10lakh': 750000,
                '10lakh+': 1000000
            };
            budgetValue = budgetMap[profileData.budgetRange] || null;
        }

        // Update the profile using company_id = user_id
        const { data, error } = await supabaseClient
            .from('industry_profile')
            .update({
                company_name: profileData.companyName,
                industry_type: profileData.industryType,
                'Contact_person': profileData.contactPerson,
                email_address: profileData.email,
                phone_no: profileData.phone,
                company_size: profileData.companySize,
                'Budget': budgetValue
            })
            .eq('company_id', user.user_id)
            .select()
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Error in updateIndustryProfile:', error);
        throw error;
    }
};

/**
 * Get platform statistics for public display
 * Fetches aggregated counts from various tables
 * @returns {Promise<Object>} - Platform statistics object
 */
export const getPlatformStats = async () => {
    let verifiedDealers = 0;
    let enterprisePartners = 0;
    let totalScrapTons = 0;
    let totalTransactions = 0;

    try {
        // Fetch verified dealers count from users table where role = 'ScrapDealer'
        const { count: dealersCount, error: dealersError } = await supabaseClient
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'ScrapDealer');

        if (dealersError) {
            console.error('Error fetching dealers count:', dealersError);
        } else {
            verifiedDealers = dealersCount || 0;
        }
    } catch (error) {
        console.error('Error in dealers count query:', error);
    }

    try {
        // Fetch enterprise partners count from industry_profile
        const { count: enterprisesCount, error: enterprisesError } = await supabaseClient
            .from('industry_profile')
            .select('*', { count: 'exact', head: true });

        if (enterprisesError) {
            console.error('Error fetching enterprises count:', enterprisesError);
        } else {
            enterprisePartners = enterprisesCount || 0;
        }
    } catch (error) {
        console.error('Error in enterprises count query:', error);
    }

    try {
        // Fetch total scrap quantity from industry_order
        const { data: scrapData, error: scrapError } = await supabaseClient
            .from('industry_order')
            .select('quantity');

        if (scrapError) {
            console.error('Error fetching scrap quantities:', scrapError);
        } else if (scrapData) {
            totalScrapTons = scrapData.reduce((sum, order) => {
                return sum + (parseFloat(order.quantity) || 0);
            }, 0);
        }
    } catch (error) {
        console.error('Error in scrap quantity query:', error);
    }

    try {
        // Fetch total transaction amount from orders table (fallback to industry_order if needed)
        let ordersData = null;
        let ordersError = null;

        // Try orders table first
        const ordersResult = await supabaseClient
            .from('orders')
            .select('total_amount');
        ordersData = ordersResult.data;
        ordersError = ordersResult.error;

        if (ordersError && ordersError.code === '42P01') {
            // Table doesn't exist, try customer_orders
            const customerResult = await supabaseClient
                .from('customer_orders')
                .select('total_amount');
            ordersData = customerResult.data;
            ordersError = customerResult.error;
        }

        if (ordersError) {
            console.error('Error fetching order amounts:', ordersError);
        } else if (ordersData) {
            totalTransactions = ordersData.reduce((sum, order) => {
                return sum + (parseFloat(order.total_amount) || 0);
            }, 0);
        }
    } catch (error) {
        console.error('Error in transaction amount query:', error);
    }

    return {
        verifiedDealers,
        enterprisePartners,
        totalScrapTons: Math.round(totalScrapTons),
        totalTransactions: Math.round(totalTransactions)
    };
};
