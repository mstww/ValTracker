import { ipcRenderer } from "electron";

export async function executeQuery(queryStr) {
  return await ipcRenderer.invoke('executeQuery', queryStr);
}

export async function createThing(thing, obj) {
  return await ipcRenderer.invoke('createThing', [thing, obj]);
}

export async function updateThing(thing, obj) {
  return await ipcRenderer.invoke('updateThing', [thing, obj]);
}

export async function switchPlayer(uuid) {
  return await ipcRenderer.invoke('switchPlayer', uuid);
}

export async function getUserEntitlement(uuid) {
  return await ipcRenderer.invoke('getUserEntitlement', uuid);
}

export async function getUserAccessToken(uuid) {
  return await ipcRenderer.invoke('getUserAccessToken', uuid);
}

export async function getCurrentUserData() {
  return await ipcRenderer.invoke('getCurrentUserData');
}

export async function getCurrentPUUID() {
  return await ipcRenderer.invoke('getCurrentPUUID');
}

export async function getInstanceToken() {
  return await ipcRenderer.invoke('getInstanceToken');
}

export async function getServiceData() {
  return await ipcRenderer.invoke('getServiceData');
}

export async function updateMessageDate(unix) {
  return await ipcRenderer.invoke('updateMessageDate', unix);
}

export async function fetchMatch(uuid) {
  return await ipcRenderer.invoke('fetchMatch', uuid);
}

export async function createMatch(data) {
  ipcRenderer.send("createMatch", data);
}

export async function removeMatch(collection, uuid) {
  return await ipcRenderer.invoke('removeMatch', [collection, uuid]);
}

export async function addSkinToWishlist(obj) {
  return await ipcRenderer.invoke('addSkinToWishlist', obj);
}

export async function rmSkinFromWishlist(obj) {
  return await ipcRenderer.invoke('rmSkinFromWishlist', obj);
}

export async function getAllSettings() {
  return await ipcRenderer.invoke('getAllSettings');
}

export async function changeSetting(name, val) {
  return await ipcRenderer.invoke('changeSetting', [name, val]);
}