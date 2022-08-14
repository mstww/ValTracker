import { motion } from "framer-motion"

const variants = {
  hidden: { opacity: 0, x: 0, y: -50 },
  enter: { opacity: 1, x: 0, y: 0 },
  exit: { opacity: 0, x: 0, y: -50 },
}

export default function MatchTypeTile({ type, text, delay, active, onClick }) {
  return (
    <motion.div 
      className={"match-tile " + (active == type ? "active" : "")}
      variants={variants}
      initial="hidden"
      animate="enter"
      exit="exit"
      transition={{ type: 'ease-in', duration: 0.2, delay: delay }}
      onClick={onClick}
    >
      <span>{ text }</span>
    </motion.div>
  )
}