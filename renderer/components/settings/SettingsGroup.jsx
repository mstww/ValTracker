import { motion } from "framer-motion"

const variants = {
  hidden: { opacity: 0, x: 0, y: -50 },
  enter: { opacity: 1, x: 0, y: 0 },
  exit: { opacity: 0, x: 0, y: -50 },
}

export default function SettingsGroup({ header, important, children }) {
  return (
    <motion.div 
      className={"mb-6"}
      variants={variants}
      initial="hidden"
      animate="enter"
      exit="exit"
      transition={{ type: 'ease-in', duration: 0.2 }}
    >
      <span className={important ? 'text-red-500' : "text-gray-500"}>{ header ? header.toUpperCase() : '' }</span>
      {children}
    </motion.div>
  )
}