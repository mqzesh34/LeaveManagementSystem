const MainPage = () => {

    const Mail: string | null = localStorage.getItem("email");
    return (
        <>
            <p>Merhaba, {Mail}</p>
        </>
    )

}
export default MainPage;