export default class HandGestureView {
    loop(fn) {
        requestAnimationFrame(fn);
    }

    scrollPage(top){
        window.scroll({
            top,
            behavior: "smooth"
        })
    }
}