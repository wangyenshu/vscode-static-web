/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/browser/dom"], function (require, exports, lifecycle_1, event_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ElementSizeObserver = void 0;
    class ElementSizeObserver extends lifecycle_1.Disposable {
        constructor(referenceDomElement, dimension) {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._referenceDomElement = referenceDomElement;
            this._width = -1;
            this._height = -1;
            this._resizeObserver = null;
            this.measureReferenceDomElement(false, dimension);
        }
        dispose() {
            this.stopObserving();
            super.dispose();
        }
        getWidth() {
            return this._width;
        }
        getHeight() {
            return this._height;
        }
        startObserving() {
            if (!this._resizeObserver && this._referenceDomElement) {
                // We want to react to the resize observer only once per animation frame
                // The first time the resize observer fires, we will react to it immediately.
                // Otherwise we will postpone to the next animation frame.
                // We'll use `observeContentRect` to store the content rect we received.
                let observedDimenstion = null;
                const observeNow = () => {
                    if (observedDimenstion) {
                        this.observe({ width: observedDimenstion.width, height: observedDimenstion.height });
                    }
                    else {
                        this.observe();
                    }
                };
                let shouldObserve = false;
                let alreadyObservedThisAnimationFrame = false;
                const update = () => {
                    if (shouldObserve && !alreadyObservedThisAnimationFrame) {
                        try {
                            shouldObserve = false;
                            alreadyObservedThisAnimationFrame = true;
                            observeNow();
                        }
                        finally {
                            (0, dom_1.scheduleAtNextAnimationFrame)((0, dom_1.getWindow)(this._referenceDomElement), () => {
                                alreadyObservedThisAnimationFrame = false;
                                update();
                            });
                        }
                    }
                };
                this._resizeObserver = new ResizeObserver((entries) => {
                    if (entries && entries[0] && entries[0].contentRect) {
                        observedDimenstion = { width: entries[0].contentRect.width, height: entries[0].contentRect.height };
                    }
                    else {
                        observedDimenstion = null;
                    }
                    shouldObserve = true;
                    update();
                });
                this._resizeObserver.observe(this._referenceDomElement);
            }
        }
        stopObserving() {
            if (this._resizeObserver) {
                this._resizeObserver.disconnect();
                this._resizeObserver = null;
            }
        }
        observe(dimension) {
            this.measureReferenceDomElement(true, dimension);
        }
        measureReferenceDomElement(emitEvent, dimension) {
            let observedWidth = 0;
            let observedHeight = 0;
            if (dimension) {
                observedWidth = dimension.width;
                observedHeight = dimension.height;
            }
            else if (this._referenceDomElement) {
                observedWidth = this._referenceDomElement.clientWidth;
                observedHeight = this._referenceDomElement.clientHeight;
            }
            observedWidth = Math.max(5, observedWidth);
            observedHeight = Math.max(5, observedHeight);
            if (this._width !== observedWidth || this._height !== observedHeight) {
                this._width = observedWidth;
                this._height = observedHeight;
                if (emitEvent) {
                    this._onDidChange.fire();
                }
            }
        }
    }
    exports.ElementSizeObserver = ElementSizeObserver;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudFNpemVPYnNlcnZlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL2NvbmZpZy9lbGVtZW50U2l6ZU9ic2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRyxNQUFhLG1CQUFvQixTQUFRLHNCQUFVO1FBVWxELFlBQVksbUJBQXVDLEVBQUUsU0FBaUM7WUFDckYsS0FBSyxFQUFFLENBQUM7WUFURCxpQkFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQzNDLGdCQUFXLEdBQWdCLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1lBU2xFLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxtQkFBbUIsQ0FBQztZQUNoRCxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDbEIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7WUFDNUIsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNuRCxDQUFDO1FBRWUsT0FBTztZQUN0QixJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDckIsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUM7UUFFTSxRQUFRO1lBQ2QsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLENBQUM7UUFFTSxTQUFTO1lBQ2YsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ3JCLENBQUM7UUFFTSxjQUFjO1lBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxJQUFJLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUN4RCx3RUFBd0U7Z0JBQ3hFLDZFQUE2RTtnQkFDN0UsMERBQTBEO2dCQUMxRCx3RUFBd0U7Z0JBRXhFLElBQUksa0JBQWtCLEdBQXNCLElBQUksQ0FBQztnQkFDakQsTUFBTSxVQUFVLEdBQUcsR0FBRyxFQUFFO29CQUN2QixJQUFJLGtCQUFrQixFQUFFLENBQUM7d0JBQ3hCLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxLQUFLLEVBQUUsa0JBQWtCLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO29CQUN0RixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNoQixDQUFDO2dCQUNGLENBQUMsQ0FBQztnQkFFRixJQUFJLGFBQWEsR0FBRyxLQUFLLENBQUM7Z0JBQzFCLElBQUksaUNBQWlDLEdBQUcsS0FBSyxDQUFDO2dCQUU5QyxNQUFNLE1BQU0sR0FBRyxHQUFHLEVBQUU7b0JBQ25CLElBQUksYUFBYSxJQUFJLENBQUMsaUNBQWlDLEVBQUUsQ0FBQzt3QkFDekQsSUFBSSxDQUFDOzRCQUNKLGFBQWEsR0FBRyxLQUFLLENBQUM7NEJBQ3RCLGlDQUFpQyxHQUFHLElBQUksQ0FBQzs0QkFDekMsVUFBVSxFQUFFLENBQUM7d0JBQ2QsQ0FBQztnQ0FBUyxDQUFDOzRCQUNWLElBQUEsa0NBQTRCLEVBQUMsSUFBQSxlQUFTLEVBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEVBQUUsR0FBRyxFQUFFO2dDQUN2RSxpQ0FBaUMsR0FBRyxLQUFLLENBQUM7Z0NBQzFDLE1BQU0sRUFBRSxDQUFDOzRCQUNWLENBQUMsQ0FBQyxDQUFDO3dCQUNKLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDLENBQUM7Z0JBRUYsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLGNBQWMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO29CQUNyRCxJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO3dCQUNyRCxrQkFBa0IsR0FBRyxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDckcsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLGtCQUFrQixHQUFHLElBQUksQ0FBQztvQkFDM0IsQ0FBQztvQkFDRCxhQUFhLEdBQUcsSUFBSSxDQUFDO29CQUNyQixNQUFNLEVBQUUsQ0FBQztnQkFDVixDQUFDLENBQUMsQ0FBQztnQkFDSCxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUN6RCxDQUFDO1FBQ0YsQ0FBQztRQUVNLGFBQWE7WUFDbkIsSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQzFCLElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1lBQzdCLENBQUM7UUFDRixDQUFDO1FBRU0sT0FBTyxDQUFDLFNBQXNCO1lBQ3BDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDbEQsQ0FBQztRQUVPLDBCQUEwQixDQUFDLFNBQWtCLEVBQUUsU0FBc0I7WUFDNUUsSUFBSSxhQUFhLEdBQUcsQ0FBQyxDQUFDO1lBQ3RCLElBQUksY0FBYyxHQUFHLENBQUMsQ0FBQztZQUN2QixJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNmLGFBQWEsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDO2dCQUNoQyxjQUFjLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQztZQUNuQyxDQUFDO2lCQUFNLElBQUksSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBQ3RDLGFBQWEsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxDQUFDO2dCQUN0RCxjQUFjLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFlBQVksQ0FBQztZQUN6RCxDQUFDO1lBQ0QsYUFBYSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQzNDLGNBQWMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUM3QyxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssYUFBYSxJQUFJLElBQUksQ0FBQyxPQUFPLEtBQUssY0FBYyxFQUFFLENBQUM7Z0JBQ3RFLElBQUksQ0FBQyxNQUFNLEdBQUcsYUFBYSxDQUFDO2dCQUM1QixJQUFJLENBQUMsT0FBTyxHQUFHLGNBQWMsQ0FBQztnQkFDOUIsSUFBSSxTQUFTLEVBQUUsQ0FBQztvQkFDZixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUMxQixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7S0FDRDtJQTlHRCxrREE4R0MifQ==