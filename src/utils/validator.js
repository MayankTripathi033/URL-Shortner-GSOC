export const validateUrl = (url) => {
    const urlPattern = /^(ftp|http|https):\/\/[^ "]+$/;
    return urlPattern.test(url);
};

export const validateInput = (input) => {
    return input && input.trim().length > 0;
};