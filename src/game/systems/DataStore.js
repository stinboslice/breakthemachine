export class DataStore {
  constructor(scene) {
    this.scene = scene;
    this.data = {};
  }

  loadAll() {
    this.data.classes = this.scene.cache.json.get("classes");
    this.data.weapons = this.scene.cache.json.get("weapons");
    this.data.buffs = this.scene.cache.json.get("buffs");
    this.data.enemies = this.scene.cache.json.get("enemies");
    this.data.levels = this.scene.cache.json.get("levels");
    this.data.dialogue = this.scene.cache.json.get("dialogue");
    this.data.specials = this.scene.cache.json.get("specials");
    this.data.hallways = this.scene.cache.json.get("hallways");
    this.data.roomRewards = this.scene.cache.json.get("room_rewards");
  }

  getClass(id) {
    return this.data.classes.find(c => c.id === id);
  }
}
