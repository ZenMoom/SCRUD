import styles from "./floatingbutton.module.css"

interface FloatingbuttonProps {
  isActive: boolean
}

export default function Floatingbutton({ isActive }: FloatingbuttonProps) {
  return (
    <button className={`${styles.floatingbutton} 
    ${isActive ? styles.active : styles.inactive}`} 
    disabled={!isActive}>
        프로젝트 생성
    </button>
  )
}