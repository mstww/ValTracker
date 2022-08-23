import { Progress } from "@nextui-org/react"

export default function ContractProgressCard({ title, reward_1, level_1, progress_max, progress_value, reward_2, level_2, level_1_isTextReward, level_2_isTextReward, isVisible }) {
  var color = 'gradient'
  if(parseInt(progress_value) === parseInt(progress_max) && progress_value !== undefined) {
    color = 'warning'
  }

  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  if(reward_1.image === null) {
    reward_1.image = 'https://media.valorant-api.com/sprays/' + reward_1.uuid + '/displayicon.png'
  }

  if(reward_2.image === null) {
    reward_2.image = 'https://media.valorant-api.com/sprays/' + reward_2.uuid + '/displayicon.png'
  }

  return(
    <>
      <span className='px-1 pt-1'>{title}</span>
      <div className='home-top-info-half relative px-2'>
        <div className='flex flex-row h-5/6 mt-1.5'>

          <div className='w-1/4 h-full flex flex-col text-center items-center justify-center'>
            {
              level_1_isTextReward ?
              <span className="relative bottom-3.5">{reward_1 ? reward_1.text : null}</span>
              :
              <>
                <div className='w-16 h-16 flex items-center justify-center'>
                  <img src={reward_1 ? reward_1.image : null} className='object-cover shadow-img' />
                </div>
                <span className='relative bottom-0 opacity-0 select-none'>{level_1}</span>
              </>
            }
            <span className='absolute bottom-1'>Level {level_1}</span>
          </div>

          <div className='w-1/2 mx-auto h-full p-2 flex flex-col justify-center text-center relative'>
            {
              isVisible ? 
              <Progress color={color} size={'xs'} max={progress_max} value={progress_value} className='bp-progress-bar' />
              :
              null
            }
            <p className='text-gray-400 mt-0'>{numberWithCommas(progress_max - progress_value)}<span className="ml-0.5 inline font-light">XP</span> TO GO</p>
          </div>

          <div className='w-1/4 h-full flex flex-col text-center items-center justify-center'>
            {
              level_2_isTextReward ? 
              <span className="relative bottom-3.5">{reward_2 ? reward_2.text : null}</span>
              :
              <>
                <div className='w-16 h-16 flex items-center justify-center'>
                  <img src={reward_2 ? reward_2.image : null} className='object-cover shadow-img' />
                </div>
                <span className='relative bottom-0 opacity-0 select-none'>{level_1}</span>
              </>
            }
            <span className='absolute bottom-1'>Level {level_2}</span>
          </div>

        </div>
      </div>
    </>
  )
}