import request from '@/utils/request'

export function getLogShipmentSettings() {
  return request({
    url: '/api/v1/xpack/log-shipment/setting/',
    method: 'get'
  })
}

export function updateLogShipmentSettings(data) {
  return request({
    url: '/api/v1/xpack/log-shipment/setting/',
    method: 'put',
    data
  })
}

export function testLogShipmentProbe(destData) {
  return request({
    url: '/api/v1/xpack/log-shipment/test/',
    method: 'post',
    data: destData
  })
}

export function testDestinationById(destId) {
  return request({
    url: `/api/v1/xpack/log-shipment/destinations/${destId}/test/`,
    method: 'post'
  })
}

export function deleteDestinationById(destId) {
  return request({
    url: `/api/v1/xpack/log-shipment/destinations/${destId}/`,
    method: 'delete'
  })
}

export function checkLogShipmentHealth(destId = null) {
  return request({
    url: '/api/v1/xpack/log-shipment/health-check/',
    method: 'post',
    data: destId ? { id: destId } : {}
  })
}
