define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ObjectPool = void 0;
    class ObjectPool {
        constructor(_create) {
            this._create = _create;
            this._unused = new Set();
            this._used = new Set();
            this._itemData = new Map();
        }
        getUnusedObj(data) {
            let obj;
            if (this._unused.size === 0) {
                obj = this._create(data);
                this._itemData.set(obj, data);
            }
            else {
                const values = [...this._unused.values()];
                obj = values.find(obj => this._itemData.get(obj).getId() === data.getId()) ?? values[0];
                this._unused.delete(obj);
                this._itemData.set(obj, data);
                obj.setData(data);
            }
            this._used.add(obj);
            return {
                object: obj,
                dispose: () => {
                    this._used.delete(obj);
                    if (this._unused.size > 5) {
                        obj.dispose();
                    }
                    else {
                        this._unused.add(obj);
                    }
                }
            };
        }
        dispose() {
            for (const obj of this._used) {
                obj.dispose();
            }
            for (const obj of this._unused) {
                obj.dispose();
            }
            this._used.clear();
            this._unused.clear();
        }
    }
    exports.ObjectPool = ObjectPool;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JqZWN0UG9vbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3dpZGdldC9tdWx0aURpZmZFZGl0b3Ivb2JqZWN0UG9vbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBTUEsTUFBYSxVQUFVO1FBS3RCLFlBQ2tCLE9BQTJCO1lBQTNCLFlBQU8sR0FBUCxPQUFPLENBQW9CO1lBTDVCLFlBQU8sR0FBRyxJQUFJLEdBQUcsRUFBSyxDQUFDO1lBQ3ZCLFVBQUssR0FBRyxJQUFJLEdBQUcsRUFBSyxDQUFDO1lBQ3JCLGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBWSxDQUFDO1FBSTdDLENBQUM7UUFFRSxZQUFZLENBQUMsSUFBVztZQUM5QixJQUFJLEdBQU0sQ0FBQztZQUVYLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzdCLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN6QixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDL0IsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sTUFBTSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7Z0JBQzFDLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN6RixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDekIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM5QixHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25CLENBQUM7WUFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNwQixPQUFPO2dCQUNOLE1BQU0sRUFBRSxHQUFHO2dCQUNYLE9BQU8sRUFBRSxHQUFHLEVBQUU7b0JBQ2IsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3ZCLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUM7d0JBQzNCLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDZixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3ZCLENBQUM7Z0JBQ0YsQ0FBQzthQUNELENBQUM7UUFDSCxDQUFDO1FBRUQsT0FBTztZQUNOLEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUM5QixHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDZixDQUFDO1lBQ0QsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2hDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNmLENBQUM7WUFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ25CLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDdEIsQ0FBQztLQUNEO0lBOUNELGdDQThDQyJ9