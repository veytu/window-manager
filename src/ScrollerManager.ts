import { logFirstTag, WindowManager } from ".";
import ViewScroller, {type ViewScrollerConfig, type ScrollCoord} from "./View/ViewScroller";
import { internalEmitter } from "./InternalEmitter";

export const ScrollerScrollEventType = 'windowMananerAppScrolling'

export class ScrollerManager {
  private readonly manager: WindowManager
  private scrollers: ViewScroller[] = []
  
  constructor ({manager}: {
    manager: WindowManager
  }) {
    this.manager = manager
    internalEmitter.on(ScrollerScrollEventType, this.onAppScrolling.bind(this))
  }

  private onAppScrolling (payload: {appId: string, x: number, y: number} | undefined) {
    console.log(`${logFirstTag} ScrollerManager onAppScrolling`, JSON.stringify(payload))
    if (payload) {
      const { appId, x, y, } = payload
      if (appId) {
        this.scrollToFromRemote(appId, { x, y })
      }
    }
  }



  public add (config: ViewScrollerConfig) {
    if (this.scrollers.find(item => item.appId == config.appId)) return

    const scroller = new ViewScroller(config)

    this.scrollers.push(scroller)
  }

  public scrollTo (appId: string, position: ScrollCoord) {
    const scroller = this.getScroller(appId)
    console.log(`${logFirstTag} ScrollerManager ScrollTo`, JSON.stringify(position))
    if (!scroller) return

    scroller.setCoord(position)
  }

  public scrollToFromRemote (appId: string, position: ScrollCoord) {
    const scroller = this.getScroller(appId)
    console.log(`${logFirstTag} ScrollerManager ScrollToFromRemote`, JSON.stringify(position))
    if (!scroller) return

    scroller.setCoordFromRemote(position)
  }

  public moveToCenter (appId?: string) {
    const center = {x: 0.5, y: 0.5}
    if (appId) {
      const scroller = this.getScroller(appId)

      scroller && this.scrollTo(scroller?.appId, center)
    } else {
      this.scrollers.forEach(item => this.scrollTo(item?.appId, center))
    }
  }

  public getScroller (appId: string) {
    if (!appId) return undefined

    return this.scrollers.find(item => item.appId == appId)
  }
  
  public remove (appId: string) {
    const scroller = this.getScroller(appId)

    if (!scroller) return

    scroller.destroy()

    this.scrollers = this.scrollers.filter(item => item.appId != appId)
  }

  public destroy() {
    // 清理所有 scroller
    this.scrollers.forEach(scroller => {
      scroller.destroy()
    })
    this.scrollers = []
  }
}
