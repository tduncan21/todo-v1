
exports.getDate = () => {
    const today = new Date();
    const options = {day: "numeric", month: "long"};
    
    return today.toLocaleDateString("en-US", options);
}
