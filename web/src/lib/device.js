// 匿名设备标识：首次访问生成 UUID，存 localStorage 持续复用
// 用途：后端按设备做每日额度计数（不收集任何个人信息）
const KEY = 'wy_device_id';

export function getDeviceId() {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
