export type CyberWheelLoadingMode = 'confirm' | 'auto' | 'preview'

export type CyberWheelLightIntensity = 'weak' | 'standard' | 'strong'

export interface CyberWheelItem {
  key: string
  label: string
  path?: string
  routePath?: string
  colorIndex?: number
  disabled?: boolean
  meta?: Record<string, any>
}

export interface CyberWheelConfig {
  visibleKeys?: string[]
  orderKeys?: string[]
  aliasMap?: Record<string, string>
  pathMap?: Record<string, string>
  defaultKey?: string
  wakeupDelay?: number
  wheelThreshold?: number
  snapDuration?: number
  loadingMode?: CyberWheelLoadingMode
  soundEnabled?: boolean
  hapticEnabled?: boolean
  lightIntensity?: CyberWheelLightIntensity
}

export interface CyberWheelPayload {
  key: string
  label: string
  path?: string
  routePath?: string
  index: number
  item: CyberWheelItem
  loadingMode: CyberWheelLoadingMode
}

export interface CyberWheelPosition {
  left?: string
  top?: string
  right?: string
  bottom?: string
  transform?: string
  zIndex?: number
}

export interface CyberWheelState {
  activeIndex: number
  activeKey?: string
  lightOn: boolean
  docked: boolean
  loading: boolean
  config: Required<CyberWheelConfig>
}
