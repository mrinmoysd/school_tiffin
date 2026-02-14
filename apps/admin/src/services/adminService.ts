import api from '@/lib/axios';
import {
    ApiResponse,
    DashboardStats,
    DeliveryFilters,
    DeliveryItem,
    DeliveryStatus,
    RecentActivity,
    ReportFilters,
    SalesReport,
    SubscriptionsReport
} from '@/types';

// Backend response type for deliveries
interface DeliveriesResponse {
  date: string;
  totalDeliveries: number;
  bySchool: Record<string, Array<{
    id: string;
    scheduledDate: string;
    status: DeliveryStatus;
    deliveredAt?: string;
    notes?: string;
    subscription: {
      subscriptionNumber: string;
      student: {
        fullName: string;
        grade?: string;
        section?: string;
        school: {
          name: string;
        };
      };
      mealPlan: {
        name: string;
      };
      parent?: {
        phoneNumber?: string;
      };
    };
  }>>;
}

// Backend response type for sales report
interface SalesReportResponse {
  period: { start: string; end: string };
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  bySchool: Record<string, { orders: number; revenue: number }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    amount: number;
    paidAt: string;
    subscription: {
      subscriptionNumber: string;
      student: {
        fullName: string;
        school: { name: string };
      };
    };
  }>;
}

// Backend response type for subscription report
interface SubscriptionReportResponse {
  byStatus: Record<string, number>;
  recentSubscriptions: number;
  totalActive: number;
}

// Helper function to generate daily revenue from orders
function generateDailyRevenue(
  orders: SalesReportResponse['orders'],
  startDate: string,
  endDate: string
) {
  const dailyMap: Record<string, { revenue: number; subscriptions: number }> = {};
  
  // Initialize all days in range
  const start = new Date(startDate);
  const end = new Date(endDate);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split('T')[0];
    dailyMap[dateKey] = { revenue: 0, subscriptions: 0 };
  }
  
  // Aggregate orders by day
  for (const order of orders) {
    if (order.paidAt) {
      const dateKey = new Date(order.paidAt).toISOString().split('T')[0];
      if (dailyMap[dateKey]) {
        dailyMap[dateKey].revenue += order.amount;
        dailyMap[dateKey].subscriptions += 1;
      }
    }
  }
  
  // Convert to array
  return Object.entries(dailyMap)
    .map(([date, data]) => ({
      date,
      revenue: data.revenue,
      subscriptions: data.subscriptions,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export const adminService = {
  // Dashboard
  getDashboard: async (): Promise<DashboardStats> => {
    const response = await api.get<ApiResponse<DashboardStats>>('/admin/dashboard');
    return response.data.data;
  },

  getRecentActivity: async (): Promise<RecentActivity> => {
    const response = await api.get<ApiResponse<RecentActivity>>('/admin/recent-activity');
    return response.data.data;
  },

  // Deliveries - transforms backend grouped response to flat array
  getDeliveries: async (filters: DeliveryFilters): Promise<DeliveryItem[]> => {
    const params = new URLSearchParams();
    params.append('date', filters.date);
    if (filters.schoolId) params.append('schoolId', filters.schoolId);
    if (filters.status) params.append('status', filters.status);
    
    const response = await api.get<ApiResponse<DeliveriesResponse>>(`/admin/deliveries?${params.toString()}`);
    const data = response.data.data;
    
    // Transform grouped data to flat array
    const deliveries: DeliveryItem[] = [];
    
    if (data && data.bySchool) {
      for (const schoolName of Object.keys(data.bySchool)) {
        const schoolDeliveries = data.bySchool[schoolName];
        for (const delivery of schoolDeliveries) {
          deliveries.push({
            id: delivery.id,
            studentName: delivery.subscription.student.fullName,
            grade: delivery.subscription.student.grade,
            schoolName: delivery.subscription.student.school.name,
            mealPlanName: delivery.subscription.mealPlan.name,
            subscriptionNumber: delivery.subscription.subscriptionNumber,
            status: delivery.status,
            parentPhone: delivery.subscription.parent?.phoneNumber,
            notes: delivery.notes,
          });
        }
      }
    }
    
    return deliveries;
  },

  markDelivered: async (deliveryIds: string[]): Promise<void> => {
    await api.post('/admin/deliveries/mark-delivered', { deliveryIds });
  },

  updateDeliveryStatus: async (deliveryId: string, status: DeliveryStatus): Promise<void> => {
    await api.patch(`/admin/deliveries/${deliveryId}`, { status });
  },

  // Reports - transforms backend response to frontend format
  getSalesReport: async (filters: ReportFilters): Promise<SalesReport> => {
    const params = new URLSearchParams();
    params.append('startDate', filters.startDate);
    params.append('endDate', filters.endDate);
    if (filters.schoolId) params.append('schoolId', filters.schoolId);
    
    const response = await api.get<ApiResponse<SalesReportResponse>>(`/admin/reports/sales?${params.toString()}`);
    const data = response.data.data;
    
    // Transform backend response to frontend format
    const schoolBreakdown = data?.bySchool 
      ? Object.entries(data.bySchool).map(([schoolName, stats]) => ({
          schoolId: schoolName, // Using school name as ID since backend doesn't return ID
          schoolName,
          revenue: stats.revenue,
          subscriptionCount: stats.orders,
        }))
      : [];
    
    // Generate daily revenue from orders (backend doesn't provide this directly)
    const dailyRevenue = data?.orders
      ? generateDailyRevenue(data.orders, filters.startDate, filters.endDate)
      : [];
    
    return {
      totalRevenue: data?.totalRevenue || 0,
      totalSubscriptions: data?.totalOrders || 0,
      averageOrderValue: data?.averageOrderValue || 0,
      schoolBreakdown,
      dailyRevenue,
    };
  },

  getSubscriptionsReport: async (filters: ReportFilters): Promise<SubscriptionsReport> => {
    const params = new URLSearchParams();
    if (filters.schoolId) params.append('schoolId', filters.schoolId);
    
    // Make the API call (backend returns limited data for now)
    await api.get<ApiResponse<SubscriptionReportResponse>>(`/admin/reports/subscriptions?${params.toString()}`);
    
    // Transform backend response to frontend format
    // Note: Backend doesn't provide detailed breakdown yet
    return {
      activeBySchool: [], // Backend doesn't provide this breakdown
      trends: [], // Backend doesn't provide trend data
    };
  },

  exportDeliveries: async (filters: DeliveryFilters, format: 'csv' | 'pdf'): Promise<Blob> => {
    const params = new URLSearchParams();
    params.append('date', filters.date);
    if (filters.schoolId) params.append('schoolId', filters.schoolId);
    params.append('format', format);
    
    const response = await api.get(`/admin/deliveries/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportSalesReport: async (filters: ReportFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    params.append('startDate', filters.startDate);
    params.append('endDate', filters.endDate);
    if (filters.schoolId) params.append('schoolId', filters.schoolId);
    
    const response = await api.get(`/admin/reports/sales/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
