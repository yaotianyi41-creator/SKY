// 单场地数据 - 后期可替换图片和信息
const venue = {
  id: 1,
  name: '办公场地名称',
  type: '办公空间',
  address: '请填写详细地址',
  phone: '400-XXX-XXXX',
  rating: 5.0,
  price: 100,
  unit: '小时',
  images: [
    'images/venue-main.jpg'
  ],
  facilities: ['投影仪', '白板', '空调', 'WiFi', '茶水', '停车'],
  description: '请填写场地介绍信息，包括场地大小、容纳人数、装修风格等。',
  notice: '1. 请提前15分钟到场\n2. 预约成功后不可退款\n3. 如需改期请提前24小时联系客服\n4. 场地使用后请保持整洁',
  openTime: '08:00',
  closeTime: '20:00',
  tags: ['环境舒适', '设备齐全']
};

// 数据存储管理
const Storage = {
  // 获取场地信息
  getVenue() {
    return venue;
  },

  // 获取订单列表
  getOrders() {
    const orders = localStorage.getItem('venue_orders');
    return orders ? JSON.parse(orders) : [];
  },

  // 保存订单
  saveOrder(order) {
    const orders = this.getOrders();
    order.id = 'ORD' + Date.now();
    order.status = 'pending';
    order.createTime = new Date().toISOString();
    orders.unshift(order);
    localStorage.setItem('venue_orders', JSON.stringify(orders));
    return order;
  },

  // 更新订单状态
  updateOrderStatus(orderId, status) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      if (status === 'paid') {
        order.payTime = new Date().toISOString();
        order.status = 'confirmed';
      } else if (status === 'cancelled') {
        order.cancelTime = new Date().toISOString();
      }
      localStorage.setItem('venue_orders', JSON.stringify(orders));
    }
    return order;
  },

  // 获取当前用户
  getUser() {
    const user = localStorage.getItem('venue_user');
    return user ? JSON.parse(user) : null;
  },

  // 保存用户信息
  saveUser(user) {
    localStorage.setItem('venue_user', JSON.stringify(user));
  },

  // 清除用户
  clearUser() {
    localStorage.removeItem('venue_user');
  },

  // 获取预约信息
  getBookingInfo() {
    const info = localStorage.getItem('venue_booking');
    return info ? JSON.parse(info) : null;
  },

  // 设置预约信息
  setBookingInfo(info) {
    localStorage.setItem('venue_booking', JSON.stringify(info));
  },

  // 清除预约信息
  clearBookingInfo() {
    localStorage.removeItem('venue_booking');
  },
  
  // 获取已预约时段（模拟数据）
  getBookedSlots(date) {
    // 这里可以从服务器获取某天已被预约的时段
    // 目前使用localStorage存储
    const key = 'booked_' + date;
    const booked = localStorage.getItem(key);
    return booked ? JSON.parse(booked) : [];
  },
  
  // 保存已预约时段
  saveBookedSlots(date, slots) {
    const key = 'booked_' + date;
    localStorage.setItem(key, JSON.stringify(slots));
  }
};

// 生成时间段
function generateTimeSlots(date, openTime, closeTime) {
  const slots = [];
  const start = parseInt(openTime.split(':')[0]);
  const end = parseInt(closeTime.split(':')[0]);
  const bookedSlots = Storage.getBookedSlots(date);
  
  for (let hour = start; hour < end; hour++) {
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    const isBooked = bookedSlots.includes(timeStr);
    slots.push({
      time: timeStr,
      available: !isBooked
    });
  }
  
  return slots;
}

// 生成未来7天日期
function generateDateList() {
  const dates = [];
  const today = new Date();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    dates.push({
      date: date.toISOString().split('T')[0],
      day: date.getDate(),
      month: date.getMonth() + 1,
      weekday: i === 0 ? '今天' : weekdays[date.getDay()]
    });
  }
  
  return dates;
}
