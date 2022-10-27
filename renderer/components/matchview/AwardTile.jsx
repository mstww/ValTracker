import { ArrowIncrease, Chess, Crosshair, Dollar, Gauge, HeartPulse, Robot, Skull } from "../SVGs";

export default function AwardTile({ icon, rotate_icon, title, desc }) {
  return(
    <div className={'w-full border-2 rounded border-maincolor-lightest mb-2 overflow-hidden p-1 award-tile'}>
      <span className='ml-1.5 relative top-0 flex flex-row'>
        { icon === '/images/chess.svg' ? <Chess className='w-9 h-10 scale-75 relative bottom-2 right-2 shadow-img' /> : null }
        { icon === '/images/dollar.svg' ? <Dollar className='w-6 relative bottom-px shadow-img' /> : null }
        { icon === '/images/skull.svg' ? <Skull className='w-6 relative bottom-px shadow-img' /> : null }
        { icon === '/images/heart_pulse.svg' ? <HeartPulse className='w-6 relative bottom-px shadow-img' /> : null }
        { icon === '/images/robot.svg' ? <Robot className='w-6 relative bottom-px shadow-img' /> : null }
        { icon === '/images/gauge.svg' ? <Gauge className='w-6 relative bottom-px shadow-img' /> : null }
        { icon === '/images/arrow_increase.svg' ? <ArrowIncrease className='w-6 relative bottom-px shadow-img' /> : null }
        { icon === '/images/crosshair.svg' ? <Crosshair className='w-6 relative bottom-px shadow-img rotate-45' /> : null }
        <span className={"text-lg " + (icon === '/images/chess.svg' ? 'relative top-1' : 'ml-2')}>{title}</span>
      </span>
      <span className='relative bottom-0 left-1.5 text-gray-500 font-light award-tile-desc'>{desc}</span>
    </div>
  )
}