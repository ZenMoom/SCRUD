import style from './page.module.css'

export default function Page() {
    return (
        <div className={style.container}>
            <div className={style.content}>전역 설정 화면</div>
        </div>
    );
}