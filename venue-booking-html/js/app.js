// 全局状态
let selectedDate = null;
let selectedSlots = [];

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
  initHomePage();
  initProfilePage();
  initEventListeners();
  
  // 检查是否有保存的登录状态
  const user = Storage.getUser();
  if (user) {
    updateProfileUI(user);
  }
});

// 初始化首页 - 显示欢迎信息
function initHomePage() {
  const venue = Storage.getVenue();
  
  // 填充首页banner
  document.getElementById('homeBannerImage').src = venue.images[0];
  document.getElementById('homeBannerName').textContent = venue.name;
  document.getElementById('homeBannerAddress').textContent = venue.address;
}

// 初始化空间介绍页
function initSpacePage() {
  const venue = Storage.getVenue();
  
  // 填充场地信息
  document.getElementById('spaceImage').src = venue.images[0];
  document.getElementById('spaceName').textContent = venue.name;
  document.getElementById('spaceRating').textContent = venue.rating;
  document.getElementById('spaceAddress').textContent = venue.address;
  document.getElementById('spaceTime').textContent = `营业时间 ${venue.openTime} - ${venue.closeTime}`;
  document.getElementById('spacePhone').textContent = venue.phone;
  document.getElementById('spaceDescription').textContent = venue.description;
  document.getElementById('spaceNotice').textContent = venue.notice;
  document.getElementById('spacePrice').textContent = venue.price;
  document.getElementById('spaceUnit').textContent = '/' + venue.unit;
  
  // 渲染标签
  const tagsHtml = venue.tags.map(tag => `<span class="tag tag-accent">${tag}</span>`).join('');
  document.getElementById('spaceTags').innerHTML = tagsHtml;
  
  // 渲染设施
  const facilitiesHtml = venue.facilities.map(f => `<div class="facility-item">✓ ${f}</div>`).join('');
  document.getElementById('spaceFacilities').innerHTML = facilitiesHtml;
}

// 初始化日历页
function initCalendarPage() {
  renderCalendarPreview();
}

// 渲染日历预览
function renderCalendarPreview() {
  const container = document.getElementById('calendarPreview');
  if (!container) return;
  
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  
  let html = '';
  
  // 星期标题
  weekdays.forEach(day => {
    html += `<div class="calendar-day-header">${day}</div>`;
  });
  
  // 空白格
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="calendar-day"></div>';
  }
  
  // 日期
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === today.getDate();
    const hasEvent = [15, 20, 25].includes(day); // 示例：活动日期
    const className = `calendar-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}`;
    html += `<div class="${className}">${day}</div>`;
  }
  
  container.innerHTML = html;
}

// 跳转到预约页
function goToBooking() {
  const venue = Storage.getVenue();
  
  // 填充预约页数据
  document.getElementById('bookingImage').src = venue.images[0];
  document.getElementById('bookingName').textContent = venue.name;
  document.getElementById('bookingPrice').textContent = `¥${venue.price}/${venue.unit}`;
  
  // 渲染日期列表
  renderDateList();
  
  // 默认选择今天
  const dates = generateDateList();
  selectDate(dates[0].date);
  
  showPage('booking');
}

// 渲染日期列表
function renderDateList() {
  const dates = generateDateList();
  const container = document.getElementById('dateList');
  
  container.innerHTML = dates.map(date => `
    <div class="date-item" data-date="${date.date}">
      <span class="weekday">${date.weekday}</span>
      <span class="date-num">${date.day}</span>
      <span class="month">${date.month}月</span>
    </div>
  `).join('');
  
  // 绑定点击事件
  container.querySelectorAll('.date-item').forEach(item => {
    item.addEventListener('click', function() {
      selectDate(this.dataset.date);
    });
  });
}

// 选择日期
function selectDate(date) {
  selectedDate = date;
  selectedSlots = [];
  updateBookingSummary();
  
  // 更新UI
  document.querySelectorAll('.date-item').forEach(item => {
    if (item.dataset.date === date) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  // 渲染时间段
  renderTimeSlots();
}

// 渲染时间段
function renderTimeSlots() {
  const venue = Storage.getVenue();
  if (!selectedDate) return;
  
  const slots = generateTimeSlots(selectedDate, venue.openTime, venue.closeTime);
  const container = document.getElementById('timeGrid');
  
  container.innerHTML = slots.map(slot => `
    <div class="time-item ${slot.available ? 'available' : 'booked'} ${selectedSlots.includes(slot.time) ? 'selected' : ''}" 
         data-time="${slot.time}">
      <span class="time-text">${slot.time}</span>
      ${slot.available ? `<span class="time-price">¥${venue.price}</span>` : '<span class="time-status">已约满</span>'}
    </div>
  `).join('');
  
  // 绑定点击事件
  container.querySelectorAll('.time-item.available').forEach(item => {
    item.addEventListener('click', function() {
      const time = this.dataset.time;
      toggleTimeSlot(time);
    });
  });
}

// 切换时间段选择
function toggleTimeSlot(time) {
  const index = selectedSlots.indexOf(time);
  if (index > -1) {
    selectedSlots.splice(index, 1);
  } else {
    selectedSlots.push(time);
    selectedSlots.sort();
  }
  
  renderTimeSlots();
  updateBookingSummary();
}

// 更新预约汇总
function updateBookingSummary() {
  const venue = Storage.getVenue();
  const count = selectedSlots.length;
  const total = venue.price * count;
  
  document.getElementById('selectedCount').textContent = count;
  document.getElementById('totalPrice').textContent = total;
  
  const confirmBtn = document.getElementById('confirmBookingBtn');
  if (confirmBtn) {
    confirmBtn.disabled = count === 0;
  }
}

// 确认预约
function confirmBooking() {
  if (selectedSlots.length === 0) {
    showToast('请选择预约时段');
    return;
  }
  
  const venue = Storage.getVenue();
  
  // 保存预约信息
  const bookingInfo = {
    date: selectedDate,
    slots: selectedSlots
  };
  Storage.setBookingInfo(bookingInfo);
  
  // 跳转到订单页
  goToOrder();
}

// 跳转到订单页
function goToOrder() {
  const venue = Storage.getVenue();
  const bookingInfo = Storage.getBookingInfo();
  
  if (!bookingInfo) {
    showToast('预约信息已过期，请重新选择');
    return;
  }
  
  const startTime = bookingInfo.slots[0];
  const endHour = parseInt(bookingInfo.slots[bookingInfo.slots.length - 1].split(':')[0]) + 1;
  const endTime = `${endHour.toString().padStart(2, '0')}:00`;
  
  // 填充订单页数据
  document.getElementById('orderImage').src = venue.images[0];
  document.getElementById('orderVenueName').textContent = venue.name;
  document.getElementById('orderVenueType').textContent = venue.type;
  document.getElementById('orderDate').textContent = bookingInfo.date;
  document.getElementById('orderTime').textContent = `${startTime}-${endTime}`;
  document.getElementById('orderDuration').textContent = bookingInfo.slots.length + ' 小时';
  document.getElementById('orderPrice').textContent = `¥${venue.price} × ${bookingInfo.slots.length}`;
  document.getElementById('orderTotal').textContent = venue.price * bookingInfo.slots.length;
  document.getElementById('orderTotalBottom').textContent = venue.price * bookingInfo.slots.length;
  
  // 预填充用户信息
  const user = Storage.getUser();
  if (user) {
    document.getElementById('contactName').value = user.name || '';
    document.getElementById('contactPhone').value = user.phone || '';
  }
  
  showPage('order');
}

// 提交订单
function submitOrder() {
  const name = document.getElementById('contactName').value.trim();
  const phone = document.getElementById('contactPhone').value.trim();
  const remark = document.getElementById('contactRemark').value.trim();
  
  if (!name) {
    showToast('请输入联系人姓名');
    return;
  }
  if (!phone) {
    showToast('请输入手机号');
    return;
  }
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    showToast('请输入正确的手机号');
    return;
  }
  
  // 保存用户信息
  Storage.saveUser({ name, phone });
  
  const venue = Storage.getVenue();
  const bookingInfo = Storage.getBookingInfo();
  const startTime = bookingInfo.slots[0];
  const endHour = parseInt(bookingInfo.slots[bookingInfo.slots.length - 1].split(':')[0]) + 1;
  const endTime = `${endHour.toString().padStart(2, '0')}:00`;
  
  // 创建订单
  const order = {
    venueName: venue.name,
    venueImage: venue.images[0],
    date: bookingInfo.date,
    time: `${startTime}-${endTime}`,
    duration: bookingInfo.slots.length,
    price: venue.price * bookingInfo.slots.length,
    contactName: name,
    contactPhone: phone,
    remark: remark
  };
  
  Storage.saveOrder(order);
  
  // 标记时段为已预约
  const bookedSlots = Storage.getBookedSlots(bookingInfo.date);
  bookingInfo.slots.forEach(slot => {
    if (!bookedSlots.includes(slot)) {
      bookedSlots.push(slot);
    }
  });
  Storage.saveBookedSlots(bookingInfo.date, bookedSlots);
  
  Storage.clearBookingInfo();
  
  showToast('预约成功！');
  
  // 延迟跳转到个人中心
  setTimeout(() => {
    showPage('profile');
    initProfilePage();
  }, 1500);
}

// 初始化个人中心页
function initProfilePage() {
  const user = Storage.getUser();
  const orders = Storage.getOrders();
  
  // 更新统计
  document.getElementById('statAll').textContent = orders.length;
  document.getElementById('statConfirmed').textContent = orders.filter(o => o.status === 'confirmed').length;
  document.getElementById('statCompleted').textContent = orders.filter(o => o.status === 'completed').length;
  document.getElementById('statCancelled').textContent = orders.filter(o => o.status === 'cancelled').length;
  
  // 渲染订单列表
  renderOrderList(orders);
  
  // 更新用户信息
  if (user) {
    updateProfileUI(user);
  }
}

// 更新个人中心UI
function updateProfileUI(user) {
  document.getElementById('userNickname').textContent = user.name || '用户';
  document.getElementById('userPhone').textContent = user.phone || '';
  document.getElementById('userPhone').style.display = user.phone ? 'block' : 'none';
  document.getElementById('userTip').style.display = user.phone ? 'none' : 'block';
  document.getElementById('logoutBtn').style.display = user.phone ? 'flex' : 'none';
}

// 渲染订单列表
function renderOrderList(orders) {
  const container = document.getElementById('orderList');
  
  if (orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-text">暂无预约记录</div>
      </div>
    `;
    return;
  }
  
  const statusMap = {
    pending: { text: '待确认', class: 'pending' },
    confirmed: { text: '已确认', class: 'confirmed' },
    completed: { text: '已完成', class: 'completed' },
    cancelled: { text: '已取消', class: 'cancelled' }
  };
  
  container.innerHTML = orders.map(order => {
    const status = statusMap[order.status] || statusMap.pending;
    return `
      <div class="order-card" data-id="${order.id}">
        <div class="order-header">
          <span class="order-id">订单号: ${order.id}</span>
          <span class="order-status ${status.class}">${status.text}</span>
        </div>
        <div class="order-content">
          <img src="${order.venueImage}" class="order-image" alt="${order.venueName}">
          <div class="order-info">
            <span class="order-venue-name">${order.venueName}</span>
            <span class="order-time">${order.date} ${order.time}</span>
            <span class="order-time">时长: ${order.duration}小时</span>
          </div>
        </div>
        <div class="order-footer">
          <span class="order-price">${order.price}</span>
          <div class="order-actions">
            ${getOrderActions(order)}
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // 绑定按钮事件
  container.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const orderId = this.closest('.order-card').dataset.id;
      const action = this.dataset.action;
      handleOrderAction(orderId, action);
    });
  });
}

// 获取订单操作按钮
function getOrderActions(order) {
  if (order.status === 'pending') {
    return `<button class="action-btn cancel" data-action="cancel">取消预约</button>`;
  } else if (order.status === 'confirmed') {
    return `<button class="action-btn cancel" data-action="cancel">取消预约</button>`;
  } else if (order.status === 'completed') {
    return `<span style="font-size:12px;color:#999;">感谢使用</span>`;
  }
  return '';
}

// 处理订单操作
function handleOrderAction(orderId, action) {
  if (action === 'cancel') {
    showModal('确认取消', '确定要取消这个预约吗？', () => {
      Storage.updateOrderStatus(orderId, 'cancelled');
      showToast('预约已取消');
      initProfilePage();
    });
  }
}

// 页面切换
function showPage(pageName) {
  // 隐藏所有页面
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  // 显示目标页面
  const targetPage = document.getElementById(pageName + 'Page');
  if (targetPage) {
    targetPage.classList.add('active');
  }
  
  // 更新底部导航
  document.querySelectorAll('.tab-item').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.page === pageName) {
      tab.classList.add('active');
    }
  });
  
  // 控制返回按钮显示
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.style.display = (pageName === 'booking' || pageName === 'order') ? 'flex' : 'none';
  }
  
  // 控制底部导航显示
  const tabBar = document.getElementById('tabBar');
  if (tabBar) {
    // 所有主要页面都显示底部导航
    const mainPages = ['home', 'space', 'calendar', 'booking', 'profile'];
    tabBar.style.display = mainPages.includes(pageName) ? 'flex' : 'none';
  }
  
  // 初始化对应页面
  if (pageName === 'space') {
    initSpacePage();
  } else if (pageName === 'calendar') {
    initCalendarPage();
  } else if (pageName === 'profile') {
    initProfilePage();
  }
  
  // 滚动到顶部
  window.scrollTo(0, 0);
}

// 返回上一页
function goBack() {
  const activePage = document.querySelector('.page.active');
  if (!activePage) return;
  
  const pageId = activePage.id;
  if (pageId === 'bookingPage') {
    showPage('home');
  } else if (pageId === 'orderPage') {
    showPage('booking');
  }
}

// 初始化事件监听
function initEventListeners() {
  // 返回按钮
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', goBack);
  }
  
  // 底部导航
  document.querySelectorAll('.tab-item').forEach(tab => {
    tab.addEventListener('click', function() {
      const page = this.dataset.page;
      if (page) {
        showPage(page);
      }
    });
  });
  
  // 登录/用户信息点击
  const userInfo = document.getElementById('userInfo');
  if (userInfo) {
    userInfo.addEventListener('click', function() {
      const user = Storage.getUser();
      if (!user || !user.phone) {
        // 模拟登录
        const name = prompt('请输入您的姓名：');
        if (name) {
          const phone = prompt('请输入您的手机号：');
          if (phone && /^1[3-9]\d{9}$/.test(phone)) {
            Storage.saveUser({ name, phone });
            updateProfileUI({ name, phone });
            showToast('登录成功！');
          } else {
            showToast('请输入正确的手机号');
          }
        }
      }
    });
  }
  
  // 退出登录
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      showModal('确认退出', '确定要退出登录吗？', () => {
        Storage.clearUser();
        location.reload();
      });
    });
  }
  
  // 联系客服
  const contactBtn = document.getElementById('contactBtn');
  if (contactBtn) {
    contactBtn.addEventListener('click', function() {
      const venue = Storage.getVenue();
      showModal('联系客服', `客服电话: ${venue.phone}`, null, false);
    });
  }
}

// 显示Toast提示
function showToast(message) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }
}

// 显示Modal弹窗
function showModal(title, text, onConfirm, showCancel = true) {
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalText = document.getElementById('modalText');
  const cancelBtn = document.getElementById('modalCancel');
  
  if (modal && modalTitle && modalText) {
    modalTitle.textContent = title;
    modalText.textContent = text;
    modal.classList.add('show');
    
    if (cancelBtn) {
      cancelBtn.style.display = showCancel ? 'block' : 'none';
    }
    
    // 确认按钮
    const confirmBtn = document.getElementById('modalConfirm');
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        modal.classList.remove('show');
        if (onConfirm) onConfirm();
      };
    }
    
    // 取消按钮
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        modal.classList.remove('show');
      };
    }
  }
}
