import multiprocessing as mp


def worker(x, qtask, output):
    data = []
    while True:
        if qtask.empty():
            break
        args = qtask.get()
        data.append(args)
        qtask.task_done()
    print("finished with "+str(x)+"e process")
    output.put(data)


def main():
    cpu_cores = mp.cpu_count()
    tasks = mp.JoinableQueue()
    # output = mp.Queue()
    output = []
    for i in range(0,20):
        tasks.put(i)
    processes = []
    for x in range(0,cpu_cores):
        # create a joinableQueue and append it to
        # the output queue
        out = mp.JoinableQueue()
        output.append(out)
        # run process and append to process list
        process = mp.Process(target=worker, args=(x, tasks, out))
        processes.append(process)
        # start process
        process.start()
    # tasks.join()
    res = []
    # print(output[0].get())
    for x in range(0,len(output)):
        res.append(output[x].get())
        # output[x].close()
    # for x in range(0,cpu_cores):
    #     processes[x].join()
    print(res)
    pass

if __name__ == '__main__':
    main()
