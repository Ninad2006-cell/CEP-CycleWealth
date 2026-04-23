import supabaseClient from '../supabase-config';

/**
 * Service for handling customer orders for upcycled products
 * Max 3 items per order
 */

/**
 * Check if product is available for adding to cart
 * @param {string} productId - Product ID
 * @returns {Promise<boolean>} - True if available
 */
export const addProductToCart = async (productId) => {
    try {
        // Check product availability using quantity, sold, and status
        const { data: product, error } = await supabaseClient
            .from('upcycled_products')
            .select('quantity, sold, status')
            .eq('product_id', productId)
            .single();

        if (error) {
            console.error('Error fetching product:', error.message, error.code, error.details);
            throw error;
        }

        console.log('Product data:', product);

        const quantity = parseInt(product?.quantity);
        const hasValidQty = !isNaN(quantity) && quantity > 0;
        const availableStock = hasValidQty ? quantity : 0;

        console.log(`Product check: quantity=${product?.quantity}(${quantity}), availableStock=${availableStock}, status=${product?.status}, hasValidQty=${hasValidQty}`);

        // Available if quantity > 0 and status is Available or incart
        const isAvailable = hasValidQty && (product?.status === 'Available' || product?.status === 'incart');
        console.log('Is available:', isAvailable);

        // Mark product as incart when added to cart
        if (isAvailable && product?.status === 'Available') {
            const { error: updateError } = await supabaseClient
                .from('upcycled_products')
                .update({ status: 'incart' })
                .eq('product_id', productId);

            if (updateError) {
                console.error('Error updating product status to incart:', updateError);
            }
        }

        return isAvailable;
    } catch (error) {
        console.error('Error checking product availability:', error.message || error);
        return false;
    }
};

/**
 * No-op for cart removal - cart is tracked in frontend only
 * @param {string} productId - Product ID
 * @returns {Promise<boolean>} - Always returns true
 */
export const removeProductFromCart = async (productId) => {
    try {
        // Restore product status to Available when removed from cart
        const { error } = await supabaseClient
            .from('upcycled_products')
            .update({ status: 'Available' })
            .eq('product_id', productId)
            .eq('status', 'incart');

        if (error) {
            console.error('Error restoring product status:', error);
        }
        return true;
    } catch (error) {
        console.error('Error in removeProductFromCart:', error);
        return true;
    }
};

/**
 * No-op for cart restoration - cart is tracked in frontend only
 * @returns {Promise<number>} - Always returns 0
 */
export const restoreAbandonedCartItems = async () => {
    // Cart is tracked in sessionStorage only, no DB restoration needed
    return 0;
};

/**
 * Get product details by ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object|null>} - Product details
 */
export const getProductById = async (productId) => {
    try {
        const { data, error } = await supabaseClient
            .from('upcycled_products')
            .select('*')
            .eq('product_id', productId)
            .single();

        if (error) {
            console.error('getProductById error:', error);
            throw error;
        }
        // Return null if product is Sold or in cart
        if (data?.status === 'Sold' || data?.status === 'incart') return null;
        return data;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
};

/**
 * Get products currently in cart (incart status) - for cart restoration
 * @returns {Promise<Array>} - List of products in cart status
 */
export const getCartProducts = async () => {
    try {
        const { data, error } = await supabaseClient
            .from('upcycled_products')
            .select(`
                *,
                skilledlabor_profile:labor_id (
                    labor_id,
                    first_name,
                    last_name,
                    city,
                    state
                )
            `)
            .eq('status', 'incart');

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching cart products:', error);
        return [];
    }
};

/**
 * Get available products for ordering
 * @returns {Promise<Array>} - List of available products
 */
export const getAvailableProducts = async () => {
    try {
        // Get all products with their quantity and sold
        const { data, error } = await supabaseClient
            .from('upcycled_products')
            .select('*');

        if (error) {
            console.error('Supabase query error:', error.message, error.code, error.details);
            throw error;
        }

        console.log('All products from DB:', data);

        // Filter products that still have stock available
        const availableProducts = (data || []).filter(product => {
            const quantity = parseInt(product.quantity) || 0;
            const status = (product.status || 'Available').trim();
            // Exclude 'Sold' products only
            const isSold = status === 'Sold';
            const hasStock = quantity > 0;
            const isAvailable = !isSold && hasStock;
            console.log(`Product ${product.name}: qty=${quantity}, status="${status}", isSold=${isSold}, hasStock=${hasStock}, isAvailable=${isAvailable}`);
            return isAvailable;
        });

        console.log('Filtered available products:', availableProducts.length, 'of', data?.length || 0, 'total');
        return availableProducts;
    } catch (error) {
        console.error('Error fetching available products:', error);
        return [];
    }
};

/**
 * Create a new order (max 3 items per order)
 * @param {Object} orderData - Order data
 * @param {Array} orderData.items - Array of items (max 3) with product_id and quantity
 * @param {Object} orderData.deliveryAddress - Delivery address details
 * @returns {Promise<Object>} - Created order
 */
export const createOrder = async (orderData) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            throw new Error('User not authenticated');
        }

        // Validate max 3 items per order
        if (!orderData.items || orderData.items.length === 0) {
            throw new Error('Please add at least one item to your order');
        }
        if (orderData.items.length > 3) {
            throw new Error('Maximum 3 items allowed per order');
        }

        // Validate delivery address (form validation only - not stored in orders table)
        const addr = orderData.deliveryAddress;
        if (!addr || !addr.fullName || !addr.phone || !addr.street || !addr.city || !addr.state || !addr.pinCode) {
            throw new Error('Please provide complete delivery address');
        }

        // Start a transaction by creating the order first
        const orderId = crypto.randomUUID();
        
        // Calculate total amount
        let totalAmount = 0;
        for (const item of orderData.items) {
            console.log('Looking up product:', item.product_id);
            const { data: product, error: productError } = await supabaseClient
                .from('upcycled_products')
                .select('*')
                .eq('product_id', item.product_id)
                .single();

            if (productError) {
                console.error('Product lookup error:', productError);
                throw new Error(`Product ${item.product_id} not found`);
            }

            // Reject only Sold products; Available and incart are valid for ordering
            if (product.status === 'Sold') {
                throw new Error(`Product ${product.name} is sold out`);
            }

            console.log('Found product:', product.name, 'status:', product.status);
            item.price = product.listed_price;
            item.labor_id = product.labor_id;
            totalAmount += (product.listed_price || 0) * (item.quantity || 1);
        }

        // Upsert customer details
        const { error: customerError } = await supabaseClient
            .from('customers')
            .upsert({
                customer_id: user.user_id,
                first_name: addr.fullName?.split(' ')[0] || addr.fullName,
                last_name: addr.fullName?.split(' ').slice(1).join(' ') || '',
                address: addr.street,
                city: addr.city,
                state: addr.state,
                pincode: addr.pinCode,
                phone_no: addr.phone
            }, { onConflict: 'customer_id' });

        if (customerError) {
            console.error('Error saving customer details:', customerError);
        }

        // Create the order
        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .insert({
                order_id: orderId,
                buyer_id: user.user_id,
                total_amount: totalAmount,
                order_status: 'processing',
                order_type: 'customers'
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // Create order items and update product sold counts
        for (const item of orderData.items) {
            // Insert order item
            const { error: itemError } = await supabaseClient
                .from('order_items')
                .insert({
                    order_id: orderId,
                    product_id: item.product_id,
                    labor_id: item.labor_id,
                    quantity: item.quantity || 1,
                    unit_price: item.price,
                    price_at_purchase: item.price
                });

            if (itemError) {
                console.error('Error creating order item:', itemError);
            }

            // Get current product data
            const { data: product } = await supabaseClient
                .from('upcycled_products')
                .select('quantity, sold, name')
                .eq('product_id', item.product_id)
                .single();

            if (!product) {
                console.error(`Product ${item.product_id} not found during order creation`);
                continue;
            }

            const quantity = parseInt(product.quantity);
            const currentSold = parseInt(product?.sold) || 0;
            const orderedQty = parseInt(item.quantity) || 1;
            const newSold = currentSold + orderedQty;
            const newQuantity = Math.max(0, (!isNaN(quantity) ? quantity : 0) - orderedQty);

            console.log(`Updating stock for ${product.name}: oldQty=${quantity}, ordered=${orderedQty}, newQty=${newQuantity}, newSold=${newSold}`);

            // Mark as Sold when quantity reaches 0
            const newStatus = newQuantity <= 0 ? 'Sold' : 'Available';
            console.log(`Setting status to: ${newStatus}`);

            const { error: updateError } = await supabaseClient
                .from('upcycled_products')
                .update({
                    quantity: newQuantity,
                    sold: newSold,
                    status: newStatus,
                    sold_price: item.price
                })
                .eq('product_id', item.product_id);

            if (updateError) console.error('Error updating product sold count:', updateError);

            // Insert into my_orders table for tracking
            const { error: myOrderError } = await supabaseClient
                .from('my_orders')
                .insert({
                    order_id: orderId,
                    product_id: item.product_id,
                    product_name: product.name || 'Unknown Product',
                    amount_bought: orderedQty,
                    customer_details: user.user_id,
                    currentstatus: 'ordered',
                    shipping_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
                    payment_status: orderData.paymentMethod === 'COD' ? 'pending' : 'paid'
                });

            if (myOrderError) {
                console.error('Error inserting into my_orders:', myOrderError);
            }
        }

        return { order };
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
};

/**
 * Get customer orders
 * @returns {Promise<Array>} - List of customer orders
 */
export const getCustomerOrders = async () => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            throw new Error('User not authenticated');
        }

        const { data, error } = await supabaseClient
            .from('orders')
            .select('*')
            .eq('buyer_id', user.user_id);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching customer orders:', error);
        return [];
    }
};

/**
 * Get artisan orders (for skilled labor)
 * @returns {Promise<Array>} - List of orders containing artisan's products
 */
export const getArtisanOrders = async () => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            throw new Error('User not authenticated');
        }

        // Get order_items for this artisan's products, then fetch related orders
        const { data: orderItems, error: itemsError } = await supabaseClient
            .from('order_items')
            .select('order_id')
            .eq('labor_id', user.user_id);

        if (itemsError) throw itemsError;

        if (!orderItems || orderItems.length === 0) {
            return [];
        }

        // Get unique order IDs
        const orderIds = [...new Set(orderItems.map(item => item.order_id))];

        // Fetch orders
        const { data, error } = await supabaseClient
            .from('orders')
            .select('*')
            .in('order_id', orderIds);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching artisan orders:', error);
        return [];
    }
};

/**
 * Cancel an order (customer can cancel if status is Pending)
 * @param {string} orderId - Order ID to cancel
 * @returns {Promise<Object>} - Updated order
 */
export const cancelOrder = async (orderId) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            throw new Error('User not authenticated');
        }

        // First check if order belongs to user and is processing
        const { data: order, error: fetchError } = await supabaseClient
            .from('orders')
            .select('order_status')
            .eq('order_id', orderId)
            .eq('buyer_id', user.user_id)
            .single();

        if (fetchError) throw fetchError;
        if (!order) throw new Error('Order not found');
        if (order.order_status !== 'processing') {
            throw new Error('Only processing orders can be cancelled');
        }

        // Update order status to delivered (schema allows processing/shipped/delivered)
        const { data: updatedOrder, error: updateError } = await supabaseClient
            .from('orders')
            .update({ order_status: 'delivered' })
            .eq('order_id', orderId)
            .select()
            .single();

        if (updateError) throw updateError;

        return { order: updatedOrder };
    } catch (error) {
        console.error('Error cancelling order:', error);
        throw error;
    }
};

/**
 * Update order status (for artisans to mark as Sold/Shipped)
 * @param {string} orderId - Order ID
 * @param {string} status - New status (Sold, Delivered, etc.)
 * @returns {Promise<Object>} - Updated order
 */
export const updateOrderStatus = async (orderId, status) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            throw new Error('User not authenticated');
        }

        const { data, error } = await supabaseClient
            .from('orders')
            .update({ order_status: status })
            .eq('order_id', orderId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
};

/**
 * Get orders for the current customer from my_orders table
 * @returns {Promise<Array>} - Array of order items
 */
export const getMyOrders = async () => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        console.log('User from sessionStorage:', user);

        if (!user?.user_id) {
            console.error('No user_id found in session:', user);
            throw new Error('User not authenticated');
        }

        console.log('Fetching my_orders for customer_details:', user.user_id);

        const { data, error } = await supabaseClient
            .from('my_orders')
            .select('*')
            .eq('customer_details', user.user_id)
            .order('shipping_date', { ascending: false });

        if (error) {
            console.error('Supabase error fetching my_orders:', error);
            throw error;
        }

        console.log('my_orders data received:', data);
        return data || [];
    } catch (error) {
        console.error('Error fetching my orders:', error.message, error);
        return [];
    }
};

/**
 * Get customer profile by customer ID
 * @param {string} customerId - Customer/user ID
 * @returns {Promise<Object|null>} - Customer profile data
 */
export const getCustomerProfile = async (customerId) => {
    try {
        const { data, error } = await supabaseClient
            .from('customers')
            .select('*')
            .eq('customer_id', customerId)
            .single();

        if (error) {
            // If no record found, return null
            if (error.code === 'PGRST116') {
                return null;
            }
            throw error;
        }
        return data;
    } catch (error) {
        console.error('Error fetching customer profile:', error);
        return null;
    }
};

/**
 * Save or update customer profile
 * @param {Object} profile - Customer profile data
 * @returns {Promise<Object>} - Saved customer data
 */
export const saveCustomerProfile = async (profile) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user?.user_id) {
            throw new Error('User not authenticated');
        }

        const customerData = {
            customer_id: user.user_id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            phone_no: profile.phone_no,
            address: profile.address,
            city: profile.city,
            state: profile.state,
            pincode: profile.pincode,
            ordered_at: new Date().toISOString()
        };

        const { data, error } = await supabaseClient
            .from('customers')
            .upsert(customerData, { onConflict: 'customer_id' })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error saving customer profile:', error);
        throw error;
    }
};
