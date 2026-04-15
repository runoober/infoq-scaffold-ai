const runtimeUni = uni;

export const getCurrentPagesSafe = () => {
  try {
    return getCurrentPages();
  } catch {
    return [];
  }
};

export default runtimeUni;
