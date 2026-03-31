import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const VendorContext = createContext();

export function useVendors() {
  return useContext(VendorContext);
}

export function VendorProvider({ children }) {
  const [vendors, setVendors] = useState([]);
  const [vendorCategories, setVendorCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('vendors')
        .select('id, name, category, rating, contact_info')
        .order('category', { ascending: true })
        .order('rating', { ascending: false });

      if (error) throw error;

      // Transform data to match expected format
      const transformedVendors = data?.map(vendor => ({
        id: vendor.id,
        type: vendor.category,
        name: vendor.name,
        status: vendor.rating > 0 ? `평점 ${vendor.rating}` : '정보 없음',
        statusColor: vendor.rating >= 4.5 ? 'var(--stage-4-color)' :
                    vendor.rating >= 4.0 ? 'var(--stage-3-color)' :
                    vendor.rating >= 3.0 ? 'var(--stage-2-color)' : 'var(--stage-1-color)'
      })) || [];

      setVendors(transformedVendors);

      // Extract unique categories
      const categories = [...new Set(transformedVendors.map(v => v.type))];
      setVendorCategories(categories);

    } catch (error) {
      console.error('Error fetching vendors:', error);
      // Fallback to empty arrays if Supabase fails
      setVendors([]);
      setVendorCategories([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <VendorContext.Provider value={{ vendors, vendorCategories, loading, refetchVendors: fetchVendors }}>
      {children}
    </VendorContext.Provider>
  );
}