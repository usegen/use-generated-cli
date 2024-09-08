export const convertPageAndPerPageToTakeAndSkip = (args={} as any) => {
  const {page,perPage,...rest} = args;
  let takeAndSkip = {
   
  }
  if (perPage !== undefined) {
    takeAndSkip = {
      skip: ((page || 1)-1)*perPage,
      take:perPage || 1000
    }
  }

  return {...rest,...takeAndSkip}
}